class Notifier {
  /**
   * Generates email subject and bodies based on order status
   * @param {string} status The order status
   * @param {number} orderId 
   * @param {string} customerName 
   * @param {string} pickupAddr 
   * @param {string} dropAddr 
   * @param {string} failedReason 
   * @returns {Object} { subject, text, html }
   */
  generateEmailTemplates(status, orderId, customerName, pickupAddr, dropAddr, failedReason = '') {
    let subject = `Order #${orderId} Update: ${status}`;
    let text = `Dear ${customerName},\n\nYour order #${orderId} from "${pickupAddr}" to "${dropAddr}" has been updated to "${status}".\n\nTrack your order live on our dashboard.\n\nThank you,\nLast-Mile Delivery Team`;
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0ea5e9;">Order Status Update</h2>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your order <strong>#${orderId}</strong> has changed status:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0; font-size: 16px;">
          Status: <strong>${status}</strong>
        </div>
        <p><strong>Route details:</strong></p>
        <ul>
          <li>Pickup Address: ${pickupAddr}</li>
          <li>Dropoff Address: ${dropAddr}</li>
        </ul>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">This is an automated delivery notification. Please do not reply directly.</p>
      </div>
    `;

    if (status === 'Failed') {
      const reasonText = failedReason || 'Receiver unavailable';
      subject = `Action Required: Order #${orderId} Delivery Failed`;
      text = `Dear ${customerName},\n\nWe attempted to deliver your order #${orderId} but it failed. Reason: "${reasonText}".\n\nPlease log into the Last-Mile Delivery Tracker dashboard to reschedule your delivery for a new date.\n\nThank you,\nLast-Mile Delivery Team`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fecdd3; border-radius: 8px; background-color: #fffbfa;">
          <h2 style="color: #e11d48;">Delivery Failed - Action Required</h2>
          <p>Dear <strong>${customerName}</strong>,</p>
          <p>We attempted to deliver your order <strong>#${orderId}</strong>, but the attempt was unsuccessful.</p>
          <div style="background-color: #ffe4e6; padding: 15px; border-left: 4px solid #e11d48; margin: 20px 0; font-size: 16px; color: #9f1239;">
            Reason: <strong>${reasonText}</strong>
          </div>
          <p><strong>What you need to do:</strong></p>
          <p>Please log in to your dashboard to reschedule the delivery for a date and time that works best for you. Once rescheduled, a delivery agent will be automatically reassigned to complete your shipment.</p>
          <hr style="border: 0; border-top: 1px solid #fecdd3; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This is an automated delivery notification. Please do not reply directly.</p>
        </div>
      `;
    }

    return { subject, text, html };
  }

  /**
   * Generates SMS message strings
   */
  generateSMSMessage(status, orderId, failedReason = '') {
    if (status === 'Failed') {
      const reasonText = failedReason || 'Receiver unavailable';
      return `Order #${orderId} delivery attempt failed. Reason: "${reasonText}". Please log in to reschedule.`;
    }
    return `Order #${orderId} update: Status is now "${status}". Check dashboard for live tracking.`;
  }

  generateVerificationEmailTemplate(userName, verificationLink) {
    const subject = 'Verify Your Email Address - Last-Mile Tracker';
    const text = `Dear ${userName},\n\nThank you for registering! Please verify your email address by clicking on the link below:\n\n${verificationLink}\n\nThis link is valid for 24 hours.\n\nThank you,\nLast-Mile Delivery Team`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0ea5e9;">Verify Your Email Address</h2>
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Thank you for registering with Last-Mile Delivery Tracker. Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your web browser:</p>
        <p style="font-size: 13px; color: #0ea5e9; word-break: break-all;">${verificationLink}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">This link is valid for 24 hours. If you did not register for this account, please ignore this email.</p>
      </div>
    `;

    return { subject, text, html };
  }
}

module.exports = new Notifier();
