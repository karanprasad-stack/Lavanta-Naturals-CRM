import { Types } from 'mongoose';
import { UserModel } from '../models/User.js';
import { NotificationModel } from '../models/Notification.js';
import { ProductActivityModel, ProductActivityAction } from '../models/ProductActivity.js';
import { IProduct } from '../models/Product.js';

/**
 * Log a product activity event
 */
export async function logProductActivity(
  productId: Types.ObjectId,
  userId: Types.ObjectId,
  action: ProductActivityAction,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await ProductActivityModel.create({
      productId,
      userId,
      action,
      metadata,
      createdAt: new Date()
    });
  } catch (err) {
    console.error('Failed to log product activity:', err);
  }
}

/**
 * Handle idempotent inventory stock alert notifications
 */
export async function handleStockAlertNotifications(
  _product: any,
  _previousQuantity: number,
  _newQuantity: number,
  _triggerUserId?: Types.ObjectId
): Promise<void> {
  // Stock alerts completely removed
  return;
}

