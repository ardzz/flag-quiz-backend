const transporter = require('../config/email');
const logger = require('../utils/logger');

class EmailService {
  async sendVerificationEmail(email, token, username) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify Your Email - Flag Guesser',
        html: `
          <h1>Welcome to Flag Guesser, ${username}!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        `,
      });
      
      logger.info(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error('Error sending verification email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email, token, username) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset - Flag Guesser',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi ${username},</p>
          <p>You requested to reset your password. Click the link below:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
      
      logger.info(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email, username) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Welcome to Flag Guesser!',
        html: `
          <h1>Welcome, ${username}!</h1>
          <p>Your email has been verified successfully.</p>
          <p>Start playing and competing on the leaderboards!</p>
          <a href="${process.env.FRONTEND_URL}">Play Now</a>
        `,
      });
      
      logger.info(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
