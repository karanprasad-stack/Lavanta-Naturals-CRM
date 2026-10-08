import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Inventory module has been completely deprecated and removed from the CRM.
 */
export const getInventory = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(410).json({ success: false, message: 'Inventory module has been removed' });
};

export const getInventorySummary = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(410).json({ success: false, message: 'Inventory module has been removed' });
};

export const getLowStockProducts = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(410).json({ success: false, message: 'Inventory module has been removed' });
};

export const getInventoryHistory = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(410).json({ success: false, message: 'Inventory module has been removed' });
};

export const recordMovement = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(410).json({ success: false, message: 'Inventory module has been removed' });
};

export const recordAdjustment = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(410).json({ success: false, message: 'Inventory module has been removed' });
};

export const getInventoryTrends = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(410).json({ success: false, message: 'Inventory module has been removed' });
};
