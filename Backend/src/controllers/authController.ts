import { Request, Response } from 'express';
import { UserModel } from '../models/User.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required.'
        });
        return;
      }

      const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        await logAuditEvent(req, {
          action: 'FAILED_LOGIN',
          metadata: { emailAttempted: email.toLowerCase().trim() }
        });
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
        return;
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        await logAuditEvent(req, {
          action: 'FAILED_LOGIN',
          userId: user._id,
          metadata: { emailAttempted: email.toLowerCase().trim() }
        });
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
        return;
      }

      if (user.status === 'INACTIVE') {
        res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact workspace administration.'
        });
        return;
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      await logAuditEvent(req, {
        action: 'LOGIN',
        userId: user._id,
        metadata: { role: user.role, email: user.email }
      });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          joiningDate: user.joiningDate,
          phone: user.phone,
          profilePhoto: user.profilePhoto,
          status: user.status
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
        error
      });
    }
  },

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        designation: req.user.designation,
        joiningDate: req.user.joiningDate,
        phone: req.user.phone,
        profilePhoto: req.user.profilePhoto,
        status: req.user.status
      }
    });
  },

  async logout(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    if (user?._id) {
      await logAuditEvent(req, {
        action: 'LOGOUT',
        userId: user._id
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  },

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Current password and new password are required' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
        return;
      }

      const user = await UserModel.findById(req.user._id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const isMatch = await comparePassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect' });
        return;
      }

      user.passwordHash = await hashPassword(newPassword);
      await user.save();

      await logAuditEvent(req, {
        action: 'USER_UPDATED',
        userId: user._id,
        metadata: { field: 'password_change' }
      });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update password', error });
    }
  }
};
