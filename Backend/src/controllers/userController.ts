import { Response } from 'express';
import { UserModel, UserRole, UserStatus } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { hashPassword } from '../utils/password.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const userController = {
  /**
   * Get team users with search, multi-filters, pagination, and real-time stats
   */
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        search,
        role,
        department,
        status,
        page = '1',
        limit = '50',
        sort = 'createdAt',
        order = 'desc'
      } = req.query;

      const filter: Record<string, any> = {};

      // 1. Search Query (Name, Email, or Designation)
      if (typeof search === 'string' && search.trim()) {
        const queryRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { name: queryRegex },
          { email: queryRegex },
          { designation: queryRegex },
          { department: queryRegex }
        ];
      }

      // 2. Role Filter
      if (typeof role === 'string' && role !== 'all' && role.trim()) {
        const normalizedRole = role.trim().toUpperCase();
        if (normalizedRole === 'HR_MANAGER' || normalizedRole === 'HR / MANAGER' || normalizedRole === 'MANAGER') {
          // If filtering by HR/Manager group
          if (role.toLowerCase() === 'manager') {
            filter.role = 'MANAGER';
          } else if (role.toLowerCase() === 'hr') {
            filter.role = 'HR';
          } else {
            filter.role = { $in: ['HR', 'MANAGER'] };
          }
        } else {
          filter.role = normalizedRole;
        }
      }

      // 3. Department Filter
      if (typeof department === 'string' && department !== 'all' && department.trim()) {
        filter.department = department.trim();
      }

      // 4. Status Filter
      if (typeof status === 'string' && status !== 'all' && status.trim()) {
        filter.status = status.trim().toUpperCase();
      }

      const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
      const pageSize = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 50));
      const skip = (pageNumber - 1) * pageSize;

      const sortField = typeof sort === 'string' ? sort : 'createdAt';
      const sortOrder = order === 'asc' ? 1 : -1;

      // Execute query with total count & stats aggregation in parallel
      const [users, totalMatching, statsAggregation] = await Promise.all([
        UserModel.find(filter)
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(pageSize),
        UserModel.countDocuments(filter),
        UserModel.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              employees: { $sum: { $cond: [{ $eq: ['$role', 'EMPLOYEE'] }, 1, 0] } },
              interns: { $sum: { $cond: [{ $eq: ['$role', 'INTERN'] }, 1, 0] } },
              hrManagers: {
                $sum: {
                  $cond: [
                    { $or: [{ $eq: ['$role', 'HR'] }, { $eq: ['$role', 'MANAGER'] }] },
                    1,
                    0
                  ]
                }
              },
              founders: { $sum: { $cond: [{ $eq: ['$role', 'FOUNDER'] }, 1, 0] } },
              active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
              departments: { $addToSet: '$department' }
            }
          }
        ])
      ]);

      const stats = statsAggregation[0] || {
        total: 0,
        employees: 0,
        interns: 0,
        hrManagers: 0,
        founders: 0,
        active: 0,
        departments: []
      };

      res.json({
        success: true,
        count: users.length,
        total: totalMatching,
        page: pageNumber,
        totalPages: Math.ceil(totalMatching / pageSize),
        stats: {
          total: stats.total,
          employees: stats.employees,
          interns: stats.interns,
          hrManagers: stats.hrManagers,
          founders: stats.founders,
          active: stats.active,
          departments: (stats.departments || []).filter(Boolean).sort()
        },
        users: users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
          designation: u.designation,
          joiningDate: u.joiningDate,
          phone: u.phone || '',
          profilePhoto: u.profilePhoto || '',
          avatar: u.profilePhoto || '',
          status: u.status,
          createdAt: u.createdAt
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve team members',
        error
      });
    }
  },

  /**
   * Lightweight endpoint returning aggregated team counts for dashboards
   */
  async getStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const statsAggregation = await UserModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            employees: { $sum: { $cond: [{ $eq: ['$role', 'EMPLOYEE'] }, 1, 0] } },
            interns: { $sum: { $cond: [{ $eq: ['$role', 'INTERN'] }, 1, 0] } },
            hrManagers: {
              $sum: {
                $cond: [
                  { $or: [{ $eq: ['$role', 'HR'] }, { $eq: ['$role', 'MANAGER'] }] },
                  1,
                  0
                ]
              }
            },
            founders: { $sum: { $cond: [{ $eq: ['$role', 'FOUNDER'] }, 1, 0] } },
            active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
            departments: { $addToSet: '$department' }
          }
        }
      ]);

      const stats = statsAggregation[0] || {
        total: 0,
        employees: 0,
        interns: 0,
        hrManagers: 0,
        founders: 0,
        active: 0,
        departments: []
      };

      // Also get 5 most recent team members for dashboard activity preview
      const recentUsers = await UserModel.find()
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        stats: {
          total: stats.total,
          employees: stats.employees,
          interns: stats.interns,
          hrManagers: stats.hrManagers,
          founders: stats.founders,
          active: stats.active,
          departments: (stats.departments || []).filter(Boolean).sort()
        },
        recentUsers: recentUsers.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
          designation: u.designation,
          joiningDate: u.joiningDate,
          profilePhoto: u.profilePhoto || '',
          avatar: u.profilePhoto || '',
          status: u.status
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve team statistics',
        error
      });
    }
  },

  /**
   * Get employee by ID
   */
  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({ success: false, message: 'Team member not found' });
        return;
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          joiningDate: user.joiningDate,
          phone: user.phone || '',
          profilePhoto: user.profilePhoto || '',
          avatar: user.profilePhoto || '',
          status: user.status,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve team member details',
        error
      });
    }
  },

  /**
   * Add team member (Restricted to FOUNDER, HR, and MANAGER)
   * RBAC constraint: HR and MANAGER cannot create FOUNDER accounts
   */
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const {
        name,
        email,
        phone,
        role = 'EMPLOYEE',
        department,
        designation,
        joiningDate,
        profilePhoto,
        status = 'ACTIVE',
        password = 'Lavanta@2026'
      } = req.body;

      if (!name || !email || !department || !designation) {
        res.status(400).json({
          success: false,
          message: 'Please provide full name, email, department, and designation.'
        });
        return;
      }

      const normalizedRole = (role as string).toUpperCase() as UserRole;

      // SECURITY RULE: Only an existing Founder can create another Founder
      if (normalizedRole === 'FOUNDER' && req.user.role !== 'FOUNDER') {
        res.status(403).json({
          success: false,
          message: 'Permission denied. Only Founder can assign the FOUNDER role.'
        });
        return;
      }

      // Check if email is already taken
      const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'A team member with this email address already exists.'
        });
        return;
      }

      const passwordHash = await hashPassword(password);

      const newUser = new UserModel({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone ? phone.trim() : '',
        role: normalizedRole,
        department: department.trim(),
        designation: designation.trim(),
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        profilePhoto: profilePhoto ? profilePhoto.trim() : '',
        status: (status as string).toUpperCase() as UserStatus
      });

      await newUser.save();

      await logAuditEvent(req, {
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: newUser._id.toString(),
        metadata: { name: newUser.name, email: newUser.email, role: newUser.role, department: newUser.department }
      });

      res.status(201).json({
        success: true,
        message: 'Team member added successfully',
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
          avatar: newUser.profilePhoto,
          status: newUser.status
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create team member',
        error
      });
    }
  },

  /**
   * Update team member details with RBAC permission enforcement
   */
  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const targetUser = await UserModel.findById(id);

      if (!targetUser) {
        res.status(404).json({ success: false, message: 'Team member not found' });
        return;
      }

      const isFounder = req.user.role === 'FOUNDER';
      const isHRorManager = req.user.role === 'HR' || req.user.role === 'MANAGER';
      const isSelf = req.user._id.toString() === targetUser._id.toString();

      // Non-managers cannot edit other users
      if (!isFounder && !isHRorManager && !isSelf) {
        res.status(403).json({
          success: false,
          message: 'Forbidden. You do not have permission to modify this team member.'
        });
        return;
      }

      // HR/Manager cannot modify Founder
      if (targetUser.role === 'FOUNDER' && !isFounder && !isSelf) {
        res.status(403).json({
          success: false,
          message: 'Permission denied. Only a Founder can modify a Founder account.'
        });
        return;
      }

      // Non-Founders cannot modify their own role
      if (isSelf && !isFounder && req.body.role !== undefined) {
        res.status(403).json({
          success: false,
          message: 'Permission denied. You cannot modify your own role.'
        });
        return;
      }

      const updates: Record<string, any> = {};
      const {
        name,
        phone,
        profilePhoto,
        designation,
        department,
        joiningDate,
        role,
        status
      } = req.body;

      if (typeof name === 'string' && name.trim()) updates.name = name.trim();
      if (typeof phone === 'string') updates.phone = phone.trim();
      if (typeof profilePhoto === 'string') updates.profilePhoto = profilePhoto.trim();

      // Privileged fields (role, department, designation, joiningDate, status)
      if (isFounder || isHRorManager) {
        if (typeof designation === 'string' && designation.trim()) updates.designation = designation.trim();
        if (typeof department === 'string' && department.trim()) updates.department = department.trim();
        if (typeof joiningDate === 'string' && joiningDate.trim()) updates.joiningDate = joiningDate.trim();
        if (typeof status === 'string') updates.status = status.toUpperCase();

        if (typeof role === 'string' && role.trim()) {
          const newRole = role.trim().toUpperCase() as UserRole;
          // Only Founder can promote anyone to Founder
          if (newRole === 'FOUNDER' && !isFounder) {
            res.status(403).json({
              success: false,
              message: 'Permission denied. Only Founder can assign the FOUNDER role.'
            });
            return;
          }
          updates.role = newRole;
        }
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      await logAuditEvent(req, {
        action: updates.role && updates.role !== targetUser.role ? 'ROLE_CHANGED' : 'USER_UPDATED',
        entityType: 'USER',
        entityId: updatedUser._id.toString(),
        metadata: {
          updatedFields: Object.keys(updates),
          previousRole: targetUser.role,
          newRole: updatedUser.role
        }
      });

      res.json({
        success: true,
        message: 'Team member updated successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          department: updatedUser.department,
          designation: updatedUser.designation,
          joiningDate: updatedUser.joiningDate,
          phone: updatedUser.phone,
          profilePhoto: updatedUser.profilePhoto,
          avatar: updatedUser.profilePhoto,
          status: updatedUser.status
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update team member',
        error
      });
    }
  },

  /**
   * Update own profile (name, phone, photo only)
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      // Reject any attempt to modify role via profile updates
      if (req.body.role !== undefined) {
        res.status(403).json({
          success: false,
          message: 'Permission denied. You cannot modify your role via profile updates.'
        });
        return;
      }

      const { name, phone, profilePhoto } = req.body;

      const updates: Record<string, any> = {};
      if (typeof name === 'string' && name.trim()) updates.name = name.trim();
      if (typeof phone === 'string') updates.phone = phone.trim();
      if (typeof profilePhoto === 'string') updates.profilePhoto = profilePhoto.trim();

      const updatedUser = await UserModel.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          department: updatedUser.department,
          designation: updatedUser.designation,
          joiningDate: updatedUser.joiningDate,
          phone: updatedUser.phone,
          profilePhoto: updatedUser.profilePhoto,
          avatar: updatedUser.profilePhoto,
          status: updatedUser.status
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
        error
      });
    }
  }
};
