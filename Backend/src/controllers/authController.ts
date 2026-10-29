import { Request, Response } from 'express';
import { UserModel, UserRole } from '../models/User.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { isAllowlistedFounderEmail, normalizeEmail } from '../config/founderAllowlist.js';

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const identifier = (req.body.identifier || req.body.email || '').trim();
      const password = req.body.password;

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          message: 'Email or mobile number and password are required.'
        });
        return;
      }

      let user = null;
      if (identifier.includes('@')) {
        user = await UserModel.findOne({ email: identifier.toLowerCase().trim() });
      } else {
        const cleanDigits = identifier.replace(/[^0-9]/g, '');
        const phoneRegexPattern = cleanDigits.length >= 7 
          ? cleanDigits.slice(-10).split('').join('[\\s\\-\\(\\)]*')
          : null;

        user = await UserModel.findOne({
          $or: [
            { phone: identifier },
            ...(phoneRegexPattern ? [{ phone: new RegExp(phoneRegexPattern) }] : [])
          ]
        });
      }

      if (!user) {
        await logAuditEvent(req, {
          action: 'FAILED_LOGIN',
          metadata: { identifierAttempted: identifier }
        });
        res.status(401).json({
          success: false,
          message: 'Invalid email/mobile number or password.'
        });
        return;
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        await logAuditEvent(req, {
          action: 'FAILED_LOGIN',
          userId: user._id,
          metadata: { identifierAttempted: identifier }
        });
        res.status(401).json({
          success: false,
          message: 'Invalid email/mobile number or password.'
        });
        return;
      }

      if (user.status === 'INACTIVE') {
        res.status(403).json({
          success: false,
          message: 'Your account is currently inactive. Please contact your administrator.'
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
  },

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, mobile, email, password } = req.body;
      const mobileNumber = (mobile || phone || '').trim();
      const cleanDigits = mobileNumber.replace(/[^0-9]/g, '');

      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Please enter your full name.' });
        return;
      }

      if (!mobileNumber || cleanDigits.length < 10) {
        res.status(400).json({ success: false, message: 'Please enter a valid mobile number.' });
        return;
      }

      if (email && email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
          return;
        }
      }

      if (!password || password.length < 8) {
        res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
        return;
      }

      // Normalize email (trim whitespace + lowercase)
      const rawEmail = (email && typeof email === 'string' && email.trim()) ? email : '';
      const normalizedEmail = normalizeEmail(rawEmail);

      // Format work email: provided normalized email or fallback corporate handle
      const userEmail = normalizedEmail || `${cleanDigits.slice(-10)}@team.lavantanaturals.com`;

      // Check if user already exists with this email or mobile
      const existingUser = await UserModel.findOne({
        $or: [
          { email: userEmail },
          { phone: mobileNumber },
          { phone: new RegExp(cleanDigits.slice(-10).split('').join('[\\s\\-\\(\\)]*')) }
        ]
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: `An account with these details already exists. Current role: ${existingUser.role}. An authorized Founder must approve any role change.`,
          currentRole: existingUser.role
        });
        return;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // SECURITY: Server-side allowlist verification
      // Any client-supplied `role` is IGNORED to prevent unauthorized privilege escalation.
      // Only authorized allowlisted emails receive the FOUNDER role; all others receive EMPLOYEE.
      const isEligibleFounder = isAllowlistedFounderEmail(userEmail);
      const assignedRole: UserRole = isEligibleFounder ? 'FOUNDER' : 'EMPLOYEE';
      const assignedDepartment = isEligibleFounder ? 'Executive' : 'Operations';
      const assignedDesignation = isEligibleFounder ? 'Founder' : 'Workspace Associate';

      const newUser = await UserModel.create({
        name: name.trim(),
        email: userEmail,
        passwordHash,
        phone: mobileNumber,
        role: assignedRole,
        department: assignedDepartment,
        designation: assignedDesignation,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      });

      // Generate session token
      const token = generateToken({
        userId: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role
      });

      await logAuditEvent(req, {
        action: 'LOGIN',
        userId: newUser._id,
        metadata: { action: 'REGISTER', role: newUser.role, email: newUser.email }
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          designation: newUser.designation,
          joiningDate: newUser.joiningDate,
          phone: newUser.phone,
          profilePhoto: newUser.profilePhoto,
          status: newUser.status
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
        error
      });
    }
  }
};
