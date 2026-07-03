const express = require('express');
const authService = require('../application/authService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Registers a new user (customer, delivery_agent). Sends verification email.
 */
router.post('/register', async (req, res) => {
  try {
    const appUrl = `${req.protocol}://${req.get('host')}`;
    const data = await authService.register(req.body, appUrl);
    res.status(201).json({
      message: 'Account created successfully!',
      ...data
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message || 'Error during registration.' });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Log in with email/password, returns a JWT
 */
router.post('/login', async (req, res) => {
  try {
    const data = await authService.login(req.body);
    res.json({
      message: 'Logged in successfully!',
      ...data
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(401).json({ error: err.message || 'Invalid credentials.' });
  }
});

/**
 * @route POST /api/auth/resend-verification
 * @desc Resends the verification email for an unverified account.
 *       Regenerates a fresh token. Safe against email enumeration.
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const appUrl = `${req.protocol}://${req.get('host')}`;
    const { email } = req.body;
    const result = await authService.resendVerification(email, appUrl);
    res.json(result);
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(400).json({ error: err.message || 'Error resending verification email.' });
  }
});

/**
 * @route GET /api/auth/verify
 * @desc Verifies the user's email using a token from the email link.
 *       Returns a standalone styled HTML page (success or failure).
 */
router.get('/verify', async (req, res) => {
  const { token } = req.query;

  // --- Success page HTML ---
  const successPage = (userName) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified — Last-Mile Tracker</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0b0f19;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(17, 24, 39, 0.9);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .icon {
      width: 72px;
      height: 72px;
      background: rgba(16, 185, 129, 0.15);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { color: #10b981; }
    h1 { font-size: 1.75rem; font-weight: 700; color: #f8fafc; margin-bottom: 12px; }
    .greeting { font-size: 1rem; color: #94a3b8; margin-bottom: 8px; }
    p { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin-bottom: 32px; }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 99px;
      margin-bottom: 24px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .btn {
      display: inline-block;
      background: #0ea5e9;
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: background 0.2s;
    }
    .btn:hover { background: #0284c7; }
    .footer { margin-top: 24px; font-size: 0.8rem; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
    <div class="badge">✓ Verified</div>
    <h1>Email Confirmed!</h1>
    <p class="greeting">Welcome, <strong style="color:#f8fafc;">${userName}</strong></p>
    <p>Your email address has been successfully verified.<br>Your account is now active and ready to use.</p>
    <a href="/" class="btn">Go to Login →</a>
    <div class="footer">Last-Mile Delivery Tracker</div>
  </div>
</body>
</html>`;

  // --- Failure page HTML ---
  const failurePage = (errorMsg) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Failed — Last-Mile Tracker</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0b0f19;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(17, 24, 39, 0.9);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .icon {
      width: 72px;
      height: 72px;
      background: rgba(239, 68, 68, 0.15);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { color: #ef4444; }
    h1 { font-size: 1.75rem; font-weight: 700; color: #f8fafc; margin-bottom: 12px; }
    .error-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 0.9rem;
      color: #fca5a5;
      margin-bottom: 24px;
      text-align: left;
    }
    p { font-size: 0.95rem; color: #64748b; line-height: 1.6; margin-bottom: 32px; }
    .btn {
      display: inline-block;
      background: #0ea5e9;
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      margin-right: 12px;
      transition: background 0.2s;
    }
    .btn:hover { background: #0284c7; }
    .btn-ghost {
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.15);
      color: #94a3b8;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    .btn-ghost:hover { border-color: rgba(255,255,255,0.35); color: #f8fafc; }
    .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .footer { margin-top: 24px; font-size: 0.8rem; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </div>
    <h1>Verification Failed</h1>
    <div class="error-box">${errorMsg}</div>
    <p>This link may have expired (links are valid for 24 hours) or has already been used.<br>
       You can request a new link from the login page.</p>
    <div class="actions">
      <a href="/" class="btn">Back to Login</a>
      <a href="/?resend=true" class="btn-ghost">Request New Link</a>
    </div>
    <div class="footer">Last-Mile Delivery Tracker</div>
  </div>
</body>
</html>`;

  try {
    const user = await authService.verifyEmail(token);
    res.send(successPage(user.name));
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(400).send(failurePage(err.message));
  }
});

/**
 * @route GET /api/auth/me
 * @desc Returns current session user info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const data = await authService.getUserSession(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
