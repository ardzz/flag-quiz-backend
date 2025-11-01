const authService = require('../services/auth.service');
const logger = require('../utils/logger');
const { successResponse } = require('../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      const result = await authService.register(username, email, password);
      
      return successResponse(res, {
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
        },
        tokens: result.tokens
      }, 'Registration successful. Please check your email to verify your account.', 201);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      const user = await authService.verifyEmail(token);
      
      return successResponse(res, {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        }
      }, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      
      return successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      return successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      
      return successResponse(res, null, 'If the email exists, a password reset link has been sent');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      
      return successResponse(res, null, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
