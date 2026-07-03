const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const notificationRepository = require('../repositories/notificationRepository');
const notifierDomain = require('../domain/notification/Notifier');

const logFilePath = path.join(process.cwd(), 'sent_emails.log');

// Cached transporter — built once on first use
let _transporter = null;
let _transporterReady = false;

/**
 * Lazily initialises and caches the Nodemailer transporter.
 * Priority:
 *   1. Real SMTP  — if SMTP_USER + SMTP_PASS are set in .env
 *   2. Ethereal   — auto-creates a free test account (dev/demo mode)
 */
async function getTransporter() {
  if (_transporter && _transporterReady) return _transporter;

  // --- Option 1: Real SMTP from .env ---
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const smtpConfig = {
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    if (process.env.SMTP_SERVICE) {
      smtpConfig.service = process.env.SMTP_SERVICE;
    } else if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      smtpConfig.host = process.env.SMTP_HOST;
      smtpConfig.port = parseInt(process.env.SMTP_PORT, 10);
      smtpConfig.secure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
    } else {
      console.warn('⚠️  SMTP: SMTP_USER/SMTP_PASS set but no SMTP_SERVICE or SMTP_HOST/PORT found. Falling back to Ethereal.');
    }

    if (smtpConfig.service || smtpConfig.host) {
      _transporter = nodemailer.createTransport(smtpConfig);
      _transporterReady = true;
      console.log(`📧  SMTP ready — using real SMTP (${process.env.SMTP_SERVICE || process.env.SMTP_HOST})`);
      return _transporter;
    }
  }

  // --- Option 2: Ethereal auto test account ---
  try {
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    _transporterReady = true;
    console.log('📧  SMTP ready — Ethereal test account auto-created');
    console.log(`    User: ${testAccount.user}`);
    console.log('    Emails will be visible at https://ethereal.email (check console for preview URLs)');
    return _transporter;
  } catch (etherealErr) {
    console.error('❌  Failed to create Ethereal test account:', etherealErr.message);
    return null;
  }
}

/**
 * Called once at server startup to warm up the transporter and log its status.
 */
async function initializeTransporter() {
  await getTransporter();
}

function appendToLocalFile(message) {
  const timestamp = new Date().toISOString();
  const fileLog = `[${timestamp}] ${message}\n----------------------------------------\n`;
  fs.appendFile(logFilePath, fileLog, (err) => {
    if (err) console.error('Failed writing to sent_emails.log:', err);
  });
}

class NotificationService {
  /**
   * Orchestrates the template generation and dispatch of email/SMS notifications
   * for order status changes. Fire-and-forget safe — never throws.
   */
  async notifyOrderStatusChange(order, customer, actorName) {
    const emailTemplates = notifierDomain.generateEmailTemplates(
      order.status,
      order.id,
      customer.name,
      order.pickup_address,
      order.drop_address,
      order.failed_reason
    );

    const smsMessage = notifierDomain.generateSMSMessage(
      order.status,
      order.id,
      order.failed_reason
    );

    // 1. Email dispatch
    if (customer.email) {
      let emailStatus = 'Skipped (SMTP not configured)';
      try {
        const transporter = await getTransporter();
        if (transporter) {
          await transporter.sendMail({
            from: '"Last-Mile Delivery Tracker" <noreply@lastmiledelivery.com>',
            to: customer.email,
            subject: emailTemplates.subject,
            text: emailTemplates.text,
            html: emailTemplates.html
          });
          emailStatus = 'Sent';
        }
      } catch (smtpErr) {
        console.error('SMTP Email failed for order notification:', smtpErr.message);
        emailStatus = 'Failed';
      }

      await notificationRepository.createNotification({
        type: 'email',
        recipient: customer.email,
        subject: emailTemplates.subject,
        body: emailTemplates.text,
        status: emailStatus
      });

      appendToLocalFile(
        `EMAIL TO: ${customer.email}\nSUBJECT: ${emailTemplates.subject}\nSTATUS: ${emailStatus}\nBODY: ${emailTemplates.text}`
      );
    }

    // 2. SMS dispatch (mocked)
    if (customer.phone) {
      await notificationRepository.createNotification({
        type: 'sms',
        recipient: customer.phone,
        subject: 'SMS Alert',
        body: smsMessage,
        status: 'Sent (Mocked)'
      });

      appendToLocalFile(`SMS TO: ${customer.phone}\nSTATUS: Sent (Mocked)\nBODY: ${smsMessage}`);
    }
  }

  /**
   * Sends an email verification link to a newly registered user.
   *
   * NEVER throws. Always:
   *   - Writes the link to sent_emails.log
   *   - Records to notifications table
   *   - Returns a result object: { success, method, previewUrl?, link }
   */
  async sendVerificationEmail(user, appUrl) {
    const host = appUrl || process.env.APP_URL || 'http://localhost:3000';
    const link = `${host}/api/auth/verify?token=${user.verification_token}`;
    const templates = notifierDomain.generateVerificationEmailTemplate(user.name, link);

    // Always write to file first — guaranteed fallback regardless of SMTP outcome
    appendToLocalFile(
      `VERIFICATION EMAIL TO: ${user.email}\nSUBJECT: ${templates.subject}\nLINK: ${link}\nSTATUS: pending SMTP`
    );

    let method = 'file_log';
    let previewUrl = null;
    let smtpError = null;

    try {
      const transporter = await getTransporter();

      if (transporter) {
        const info = await transporter.sendMail({
          from: '"Last-Mile Delivery Tracker" <noreply@lastmiledelivery.com>',
          to: user.email,
          subject: templates.subject,
          text: templates.text,
          html: templates.html
        });

        // Ethereal returns a preview URL; real SMTP returns undefined here
        previewUrl = nodemailer.getTestMessageUrl(info) || null;
        method = previewUrl ? 'ethereal' : 'smtp';

        if (previewUrl) {
          console.log(`📬  Verification email sent!`);
          console.log(`    To: ${user.email}`);
          console.log(`    Preview URL: ${previewUrl}`);
        } else {
          console.log(`📬  Verification email sent via SMTP to: ${user.email}`);
        }
      }
    } catch (err) {
      smtpError = err.message;
      method = 'file_log';
      console.error(`❌  Verification email SMTP failed for ${user.email}:`, err.message);
      console.log(`    🔗  Fallback link (also in sent_emails.log): ${link}`);
    }

    // Record to notifications table
    await notificationRepository.createNotification({
      type: 'email',
      recipient: user.email,
      subject: templates.subject,
      body: templates.text,
      status: method === 'smtp' ? 'Sent (SMTP)'
            : method === 'ethereal' ? 'Sent (Ethereal)'
            : `Failed - logged to file`
    }).catch(() => {}); // non-critical, don't block

    return {
      success: method !== 'file_log',
      method,         // 'smtp' | 'ethereal' | 'file_log'
      previewUrl,     // Ethereal preview URL or null
      link,           // always the raw verification link
      error: smtpError
    };
  }

  async getAuditLogs() {
    return await notificationRepository.findAllLogs();
  }
}

module.exports = new NotificationService();
module.exports.initializeTransporter = initializeTransporter;
