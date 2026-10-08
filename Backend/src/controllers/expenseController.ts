import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ExpenseModel, IExpense, ExpenseStatus, ExpenseCategory } from '../models/Expense.js';
import { ExpenseActivityModel, ExpenseActivityType } from '../models/ExpenseActivity.js';
import { NotificationModel } from '../models/Notification.js';
import { UserModel } from '../models/User.js';
import { getStorageProvider } from '../services/storage/index.js';
import { logAuditEvent } from '../utils/auditLogger.js';

/**
 * Helper to log expense activity
 */
async function logExpenseActivity(
  expenseId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  type: ExpenseActivityType,
  metadata: Record<string, any> = {}
) {
  try {
    await ExpenseActivityModel.create({
      expenseId,
      userId,
      type,
      metadata,
      createdAt: new Date()
    });
  } catch (err) {
    console.error('Failed to log expense activity:', err);
  }
}

/**
 * POST /api/expenses
 * Create a new expense (DRAFT or SUBMITTED)
 */
export const createExpense = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      title,
      description,
      amount,
      category,
      salesChannel = 'GENERAL',
      expenseDate,
      paymentMethod,
      department,
      taxDeductible,
      notes,
      status: reqStatus
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Expense title is required' });
      return;
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ success: false, message: 'Expense amount must be a positive number' });
      return;
    }

    const validCategories: ExpenseCategory[] = [
      'MARKETPLACE_FEES',
      'PAYMENT_FEES',
      'SHIPPING',
      'PACKAGING',
      'MARKETING',
      'ADVERTISING',
      'OPERATIONS',
      'SALARY',
      'RENT',
      'UTILITIES',
      'SOFTWARE',
      'OFFICE',
      'TRAVEL',
      'SUPPLIES',
      'MAINTENANCE',
      'INVENTORY',
      'OTHER'
    ];

    if (!category || !validCategories.includes(category)) {
      res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
      return;
    }

    const validChannels = ['GENERAL', 'WEBSITE', 'AMAZON', 'FLIPKART', 'OTHER'];
    const normalizedChannel = (salesChannel || 'GENERAL').toUpperCase();
    const targetChannel = validChannels.includes(normalizedChannel) ? normalizedChannel : 'GENERAL';

    const status: ExpenseStatus = reqStatus === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';

    // Handle receipt file if attached via multer
    let receiptData = undefined;
    if (req.file) {
      const storage = getStorageProvider();
      const saved = await storage.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'documents'
      );
      receiptData = {
        fileName: saved.fileName,
        fileUrl: saved.fileUrl,
        storageKey: saved.storageKey,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize
      };
    }

    const expense = await ExpenseModel.create({
      title: title.trim(),
      description: description ? description.trim() : undefined,
      amount: Number(parsedAmount.toFixed(2)),
      category,
      salesChannel: targetChannel,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      receipt: receiptData,
      status,
      submittedBy: user._id,
      submittedAt: status === 'SUBMITTED' ? new Date() : undefined,
      department: department || user.department || 'Operations',
      taxDeductible: taxDeductible === true || taxDeductible === 'true',
      notes: notes ? notes.trim() : undefined
    });

    await logExpenseActivity(
      expense._id,
      user._id,
      status === 'SUBMITTED' ? 'EXPENSE_SUBMITTED' : 'EXPENSE_CREATED',
      {
        amount: expense.amount,
        category: expense.category
      }
    );

    // If submitted, notify Founders and Managers
    if (status === 'SUBMITTED') {
      try {
        const managersAndFounders = await UserModel.find({
          role: { $in: ['FOUNDER', 'MANAGER'] },
          status: 'ACTIVE',
          _id: { $ne: user._id }
        });

        for (const recipient of managersAndFounders) {
          await NotificationModel.create({
            recipient: recipient._id,
            type: 'EXPENSE_SUBMITTED',
            title: 'New Expense Submitted for Approval',
            message: `${user.name} submitted an expense: "${expense.title}" for ₹${expense.amount.toLocaleString()}`,
            entityType: 'EXPENSE',
            entityId: expense._id,
            actionUrl: `/expenses/${expense._id}`,
            metadata: {
              amount: expense.amount,
              category: expense.category,
              submittedBy: user.name
            }
          });
        }
      } catch (notifyErr) {
        console.error('Failed to dispatch expense submission notifications:', notifyErr);
      }
    }

    res.status(201).json({
      success: true,
      message: `Expense ${status === 'DRAFT' ? 'draft saved' : 'submitted'} successfully`,
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create expense'
    });
  }
};

/**
 * GET /api/expenses
 * List expenses with role-scoped visibility and filters
 */
export const getExpenses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      status,
      category,
      salesChannel,
      department,
      search,
      startDate,
      endDate,
      page = '1',
      limit = '20',
      submittedBy
    } = req.query;

    const filter: any = {};

    // Channel filter
    if (salesChannel && typeof salesChannel === 'string' && salesChannel !== 'ALL') {
      filter.salesChannel = salesChannel.toUpperCase();
    }

    // RBAC Scoping:
    // FOUNDER & HR: see all expenses
    // MANAGER: see own department + own submitted
    // EMPLOYEE & INTERN: see strictly their own submitted expenses
    if (user.role === 'EMPLOYEE' || user.role === 'INTERN') {
      filter.submittedBy = user._id;
    } else if (user.role === 'MANAGER') {
      if (department) {
        filter.department = department;
      } else {
        filter.$or = [
          { department: user.department },
          { submittedBy: user._id }
        ];
      }
    } else {
      // FOUNDER, HR
      if (department) {
        filter.department = department;
      }
      if (submittedBy && mongoose.Types.ObjectId.isValid(submittedBy as string)) {
        filter.submittedBy = new mongoose.Types.ObjectId(submittedBy as string);
      }
    }

    if (status && typeof status === 'string') {
      filter.status = status;
    }

    if (category && typeof category === 'string') {
      filter.category = category;
    }

    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) {
        filter.expenseDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.expenseDate.$lte = end;
      }
    }

    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit as string) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
      ExpenseModel.find(filter)
        .populate('submittedBy', 'name email role department')
        .populate('approvedBy', 'name email role')
        .populate('rejectedBy', 'name email role')
        .sort({ expenseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ExpenseModel.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch expenses'
    });
  }
};

/**
 * GET /api/expenses/:id
 * Get single expense detail with audit history
 */
export const getExpenseById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid expense ID' });
      return;
    }

    const expense = await ExpenseModel.findById(id)
      .populate('submittedBy', 'name email role department')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role');

    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    // Role check
    const isOwner = expense.submittedBy._id.toString() === user._id.toString();
    const isManagerSameDept =
      user.role === 'MANAGER' && expense.department === user.department;
    const isPrivileged = user.role === 'FOUNDER' || user.role === 'HR';

    if (!isOwner && !isManagerSameDept && !isPrivileged) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view this expense'
      });
      return;
    }

    const activities = await ExpenseActivityModel.find({ expenseId: expense._id })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...expense.toObject(),
        activities
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch expense'
    });
  }
};

/**
 * POST /api/expenses/:id/submit
 * Submit a draft expense for review
 */
export const submitExpense = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const expense = await ExpenseModel.findById(id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    if (expense.submittedBy.toString() !== user._id.toString() && user.role !== 'FOUNDER') {
      res.status(403).json({ success: false, message: 'Only the submitter can submit this expense' });
      return;
    }

    if (expense.status !== 'DRAFT') {
      res.status(400).json({
        success: false,
        message: `Only draft expenses can be submitted. Current status: ${expense.status}`
      });
      return;
    }

    expense.status = 'SUBMITTED';
    expense.submittedAt = new Date();
    await expense.save();

    await logExpenseActivity(expense._id, user._id, 'EXPENSE_SUBMITTED', {
      amount: expense.amount
    });

    // Notify Founder/Managers
    try {
      const managersAndFounders = await UserModel.find({
        role: { $in: ['FOUNDER', 'MANAGER'] },
        status: 'ACTIVE',
        _id: { $ne: user._id }
      });

      for (const recipient of managersAndFounders) {
        await NotificationModel.create({
          recipient: recipient._id,
          type: 'EXPENSE_SUBMITTED',
          title: 'Expense Submitted for Approval',
          message: `${user.name} submitted an expense: "${expense.title}" for ₹${expense.amount.toLocaleString()}`,
          entityType: 'EXPENSE',
          entityId: expense._id,
          actionUrl: `/expenses/${expense._id}`,
          metadata: {
            amount: expense.amount,
            category: expense.category,
            submittedBy: user.name
          }
        });
      }
    } catch (notifyErr) {
      console.error('Failed to send notification for expense submission:', notifyErr);
    }

    res.status(200).json({
      success: true,
      message: 'Expense submitted for approval',
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit expense'
    });
  }
};

/**
 * POST /api/expenses/:id/approve
 * Approve a submitted expense (FOUNDER, MANAGER, HR)
 */
export const approveExpense = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const expense = await ExpenseModel.findById(id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    if (expense.status !== 'SUBMITTED') {
      res.status(400).json({
        success: false,
        message: `Only submitted expenses can be approved. Current status: ${expense.status}`
      });
      return;
    }

    // Role check
    if (user.role === 'MANAGER' && expense.department !== user.department) {
      res.status(403).json({
        success: false,
        message: 'Managers can only approve expenses from their own department'
      });
      return;
    }

    expense.status = 'APPROVED';
    expense.approvedBy = user._id;
    expense.approvedAt = new Date();
    expense.rejectionReason = undefined;
    expense.rejectedBy = undefined;
    expense.rejectedAt = undefined;
    await expense.save();

    await logExpenseActivity(expense._id, user._id, 'EXPENSE_APPROVED', {
      amount: expense.amount
    });

    await logAuditEvent(req, {
      action: 'EXPENSE_APPROVED',
      entityType: 'EXPENSE',
      entityId: expense._id.toString(),
      metadata: { title: expense.title, amount: expense.amount, category: expense.category }
    });

    // Notify submitter
    try {
      await NotificationModel.create({
        recipient: expense.submittedBy,
        type: 'EXPENSE_APPROVED',
        title: 'Expense Approved',
        message: `Your expense "${expense.title}" for ₹${expense.amount.toLocaleString()} has been approved by ${user.name}`,
        entityType: 'EXPENSE',
        entityId: expense._id,
        actionUrl: `/expenses/${expense._id}`,
        metadata: {
          approvedBy: user.name,
          amount: expense.amount
        }
      });
    } catch (err) {
      console.error('Failed to notify submitter of approval:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Expense approved successfully',
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve expense'
    });
  }
};

/**
 * POST /api/expenses/:id/reject
 * Reject a submitted expense with mandatory rejectionReason
 */
export const rejectExpense = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length < 5) {
      res.status(400).json({
        success: false,
        message: 'A detailed rejection reason (at least 5 characters) is required'
      });
      return;
    }

    const expense = await ExpenseModel.findById(id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    if (expense.status !== 'SUBMITTED') {
      res.status(400).json({
        success: false,
        message: `Only submitted expenses can be rejected. Current status: ${expense.status}`
      });
      return;
    }

    if (user.role === 'MANAGER' && expense.department !== user.department) {
      res.status(403).json({
        success: false,
        message: 'Managers can only reject expenses from their own department'
      });
      return;
    }

    expense.status = 'REJECTED';
    expense.rejectedBy = user._id;
    expense.rejectedAt = new Date();
    expense.rejectionReason = rejectionReason.trim();
    await expense.save();

    await logExpenseActivity(expense._id, user._id, 'EXPENSE_REJECTED', {
      reason: rejectionReason.trim()
    });

    await logAuditEvent(req, {
      action: 'EXPENSE_REJECTED',
      entityType: 'EXPENSE',
      entityId: expense._id.toString(),
      metadata: { title: expense.title, amount: expense.amount, reason: rejectionReason.trim() }
    });

    // Notify submitter
    try {
      await NotificationModel.create({
        recipient: expense.submittedBy,
        type: 'EXPENSE_REJECTED',
        title: 'Expense Rejected',
        message: `Your expense "${expense.title}" was rejected: ${rejectionReason.trim()}`,
        entityType: 'EXPENSE',
        entityId: expense._id,
        actionUrl: `/expenses/${expense._id}`,
        metadata: {
          rejectedBy: user.name,
          reason: rejectionReason.trim()
        }
      });
    } catch (err) {
      console.error('Failed to notify submitter of rejection:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Expense rejected successfully',
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject expense'
    });
  }
};

/**
 * POST /api/expenses/:id/pay
 * Mark an approved expense as PAID
 */
export const payExpense = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { paymentReference } = req.body;

    const expense = await ExpenseModel.findById(id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    if (expense.status !== 'APPROVED') {
      res.status(400).json({
        success: false,
        message: `Only approved expenses can be marked as paid. Current status: ${expense.status}`
      });
      return;
    }

    expense.status = 'PAID';
    expense.paidAt = new Date();
    if (paymentReference) {
      expense.paymentReference = paymentReference.trim();
    }
    await expense.save();

    await logExpenseActivity(expense._id, user._id, 'EXPENSE_PAID', {
      paymentReference: expense.paymentReference
    });

    res.status(200).json({
      success: true,
      message: 'Expense marked as paid',
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark expense as paid'
    });
  }
};

/**
 * POST /api/expenses/:id/cancel
 * Cancel an expense
 */
export const cancelExpense = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const expense = await ExpenseModel.findById(id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    if (expense.submittedBy.toString() !== user._id.toString() && user.role !== 'FOUNDER') {
      res.status(403).json({ success: false, message: 'Not authorized to cancel this expense' });
      return;
    }

    if (expense.status === 'PAID') {
      res.status(400).json({ success: false, message: 'Paid expenses cannot be cancelled' });
      return;
    }

    expense.status = 'CANCELLED';
    await expense.save();

    await logExpenseActivity(expense._id, user._id, 'EXPENSE_CANCELLED');

    res.status(200).json({
      success: true,
      message: 'Expense cancelled',
      data: expense
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel expense'
    });
  }
};

/**
 * GET /api/expenses/summary
 * Summary metrics of expenses
 */
export const getExpenseSummary = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const filter: any = {};

    if (user.role === 'EMPLOYEE' || user.role === 'INTERN') {
      filter.submittedBy = user._id;
    } else if (user.role === 'MANAGER') {
      filter.$or = [
        { department: user.department },
        { submittedBy: user._id }
      ];
    }

    const [
      totalCount,
      draftCount,
      submittedCount,
      approvedCount,
      paidCount,
      rejectedCount,
      totalPaidAgg,
      totalApprovedAgg,
      totalSubmittedAgg
    ] = await Promise.all([
      ExpenseModel.countDocuments(filter),
      ExpenseModel.countDocuments({ ...filter, status: 'DRAFT' }),
      ExpenseModel.countDocuments({ ...filter, status: 'SUBMITTED' }),
      ExpenseModel.countDocuments({ ...filter, status: 'APPROVED' }),
      ExpenseModel.countDocuments({ ...filter, status: 'PAID' }),
      ExpenseModel.countDocuments({ ...filter, status: 'REJECTED' }),
      ExpenseModel.aggregate([
        { $match: { ...filter, status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      ExpenseModel.aggregate([
        { $match: { ...filter, status: 'APPROVED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      ExpenseModel.aggregate([
        { $match: { ...filter, status: 'SUBMITTED' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalPaidAmount = totalPaidAgg[0]?.total || 0;
    const totalApprovedAmount = totalApprovedAgg[0]?.total || 0;
    const totalSubmittedAmount = totalSubmittedAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        counts: {
          total: totalCount,
          draft: draftCount,
          submitted: submittedCount,
          approved: approvedCount,
          paid: paidCount,
          rejected: rejectedCount
        },
        amounts: {
          paid: Number(totalPaidAmount.toFixed(2)),
          approved: Number(totalApprovedAmount.toFixed(2)),
          submitted: Number(totalSubmittedAmount.toFixed(2)),
          committed: Number((totalPaidAmount + totalApprovedAmount).toFixed(2))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch expense summary'
    });
  }
};

/**
 * GET /api/expenses/:id/receipt
 * Download receipt file for an expense
 */
export const getExpenseReceipt = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const expense = await ExpenseModel.findById(id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    if (!expense.receipt || !expense.receipt.storageKey) {
      res.status(404).json({ success: false, message: 'No receipt attached to this expense' });
      return;
    }

    // RBAC check
    const isOwner = expense.submittedBy.toString() === user._id.toString();
    const isManagerSameDept = user.role === 'MANAGER' && expense.department === user.department;
    const isPrivileged = user.role === 'FOUNDER' || user.role === 'HR';

    if (!isOwner && !isManagerSameDept && !isPrivileged) {
      res.status(403).json({ success: false, message: 'Not authorized to access this receipt' });
      return;
    }

    const storage = getStorageProvider();
    const fileResult = await storage.getFileStream(expense.receipt.storageKey);

    res.setHeader('Content-Type', expense.receipt.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${expense.receipt.fileName}"`);
    fileResult.stream.pipe(res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve receipt'
    });
  }
};
