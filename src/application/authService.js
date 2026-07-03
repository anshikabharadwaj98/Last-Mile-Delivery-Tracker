const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const identityRepository = require('../repositories/identityRepository');
const { DeliveryAgent } = require('../models');
const notificationService = require('./notificationService');

// Load JWT secret configuration
const JWT_SECRET = process.env.JWT_SECRET || 'last_mile_super_secret_key';

class AuthService {
  /**
   * Orchestrates registration of a new user
   */
  async register({ name, email, password, role, phone, company_name, company_address, house_address, gstin }, appUrl) {
    const targetEmail = (email || '').trim().toLowerCase();
    if (!targetEmail || !password) {
      throw new Error('Email and password are required fields.');
    }

    // Map legacy 'agent' role input to HLD-compliant 'delivery_agent'
    let targetRole = role || 'customer';
    if (targetRole === 'agent') {
      targetRole = 'delivery_agent';
    }

    if (!['customer', 'delivery_agent'].includes(targetRole)) {
      throw new Error('Self-registration is only allowed for customers and delivery agents.');
    }

    const existingUser = await identityRepository.findByEmail(targetEmail);
    if (existingUser) {
      throw new Error('An account with this email address already exists.');
    }

    // Classify user type and extract correct address & name values
    let customerType = 'B2C';
    let targetName = (name || '').trim() || (company_name || '').trim();
    let targetAddress = (house_address || '').trim();
    let targetGstin = (gstin || '').trim() || null;
    let targetCompanyName = (company_name || '').trim() || null;

    if (targetRole === 'customer') {
      const genericDomains = [
        'gmail.com', 'googlemail.com',
        'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
        'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
        'icloud.com', 'me.com', 'mac.com',
        'protonmail.com', 'proton.me', 'tutanota.com', 'tuta.io',
        'aol.com', 'zoho.com', 'gmx.com', 'mail.com'
      ];
      const emailParts = targetEmail.split('@');
      const emailDomain = emailParts[1];

      if (targetGstin) {
        // Has valid GSTIN -> Classify as B2B (Always takes priority)
        customerType = 'B2B';
        targetCompanyName = targetCompanyName || targetName;
        targetAddress = (company_address || '').trim() || targetAddress;
      } else {
        // No GSTIN -> Check email domain
        if (genericDomains.includes(emailDomain)) {
          // Generic Domain -> Classify as B2C
          customerType = 'B2C';
          targetAddress = (house_address || '').trim() || (company_address || '').trim();
        } else {
          // Custom Corporate Domain -> Auto-B2B
          customerType = 'B2B';
          targetCompanyName = targetCompanyName || targetName;
          targetAddress = (company_address || '').trim() || targetAddress;
        }
      }

      // Final adjustments if classified as B2B
      if (customerType === 'B2B') {
        targetCompanyName = targetCompanyName || targetName || 'Business Customer';
        targetName = targetCompanyName;

        if (targetGstin) {
          const existingGstin = await identityRepository.findByGstin(targetGstin);
          if (existingGstin) {
            throw new Error('This GSTIN number is already registered.');
          }
        }
      }
    }

    if (!targetName) {
      throw new Error('Name or company name is required.');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save User record in DB
    const user = await identityRepository.create({
      name: targetName,
      email: targetEmail,
      password_hash: passwordHash,
      role: targetRole,
      phone: phone ? phone.trim() : null,
      customer_type: customerType,
      company_name: targetCompanyName,
      gstin: targetGstin,
      address: targetAddress,
      is_verified: false,
      verification_token: verificationToken,
      verification_token_expires: verificationTokenExpires
    });

    // If role is delivery agent, create the corresponding 1-to-1 extension record
    if (targetRole === 'delivery_agent') {
      await DeliveryAgent.create({
        user_id: user.id,
        current_zone_id: null,
        is_available: true,
        latitude: null,
        longitude: null
      });
    }

    // Send verification email — result never throws, always returns status object
    const emailResult = await notificationService.sendVerificationEmail(user, appUrl);

    // Build a response message that accurately reflects what happened
    let registrationMessage;
    if (emailResult.success && emailResult.method === 'smtp') {
      registrationMessage = 'Registration successful! A verification email has been sent to your inbox.';
    } else if (emailResult.success && emailResult.method === 'ethereal') {
      registrationMessage = 'Registration successful! Check the server console for your email preview link.';
    } else {
      registrationMessage = 'Registration successful! Email delivery is not configured — use the verification link below.';
    }

    const responsePayload = {
      message: registrationMessage,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        customer_type: user.customer_type,
        company_name: user.company_name,
        gstin: user.gstin,
        address: user.address,
        is_verified: user.is_verified
      }
    };

    // In dev/fallback mode always expose the verification link directly in the response
    // so developers can test without an inbox (Ethereal preview or file log fallback)
    if (emailResult.method !== 'smtp') {
      responsePayload.verification_link = emailResult.link;
    }
    if (emailResult.previewUrl) {
      responsePayload.email_preview_url = emailResult.previewUrl;
    }

    return responsePayload;
  }

  /**
   * Orchestrates login authentication
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const user = await identityRepository.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.is_active) {
      throw new Error('This account has been deactivated.');
    }

    if (!user.is_verified) {
      throw new Error('Please verify your email address before logging in.');
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Flatten location fields for agent session response
    const agentDetails = user.deliveryAgent || {};

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        latitude: agentDetails.latitude,
        longitude: agentDetails.longitude,
        current_zone_id: agentDetails.current_zone_id,
        current_hub_prefix: agentDetails.current_zone_id,
        customer_type: user.customer_type,
        company_name: user.company_name,
        gstin: user.gstin,
        address: user.address
      }
    };
  }

  async getUserSession(userId) {
    const user = await identityRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const agentDetails = user.deliveryAgent || {};

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        latitude: agentDetails.latitude,
        longitude: agentDetails.longitude,
        current_zone_id: agentDetails.current_zone_id,
        current_hub_prefix: agentDetails.current_zone_id,
        customer_type: user.customer_type,
        company_name: user.company_name,
        gstin: user.gstin,
        address: user.address
      }
    };
  }

  async verifyEmail(token) {
    if (!token) {
      throw new Error('Verification token is required.');
    }

    const user = await identityRepository.findByVerificationToken(token);
    if (!user) {
      throw new Error('Verification token is invalid or has expired.');
    }

    user.is_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;
    await identityRepository.save(user);

    return user;
  }

  /**
   * Resends the verification email for an unverified account.
   * Regenerates the token so expired links are refreshed.
   * Never reveals whether an email exists (anti-enumeration).
   */
  async resendVerification(email, appUrl) {
    const targetEmail = (email || '').trim().toLowerCase();
    if (!targetEmail) {
      throw new Error('Email address is required.');
    }

    const user = await identityRepository.findByEmail(targetEmail);

    // Return generic success if user not found — prevents email enumeration
    if (!user) {
      return { message: 'If that email is registered and unverified, a new link has been sent.' };
    }

    // Already verified — no need to resend
    if (user.is_verified) {
      return { message: 'This account is already verified. You can log in.', alreadyVerified: true };
    }

    // Regenerate token and expiry
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    user.verification_token = verificationToken;
    user.verification_token_expires = verificationTokenExpires;
    await identityRepository.save(user);

    const emailResult = await notificationService.sendVerificationEmail(user, appUrl);

    const responsePayload = {
      message: 'A new verification email has been sent. Please check your inbox.'
    };

    if (emailResult.method !== 'smtp') {
      responsePayload.verification_link = emailResult.link;
    }
    if (emailResult.previewUrl) {
      responsePayload.email_preview_url = emailResult.previewUrl;
    }

    return responsePayload;
  }
}

module.exports = new AuthService();
