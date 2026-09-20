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
  product: IProduct,
  previousQuantity: number,
  newQuantity: number,
  triggerUserId?: Types.ObjectId
): Promise<void> {
  try {
    // Find all founders and managers
    const managersAndFounders = await UserModel.find({
      role: { $in: ['FOUNDER', 'MANAGER'] },
      status: 'ACTIVE'
    }).select('_id name role');

    if (!managersAndFounders.length) return;

    const threshold = product.lowStockThreshold;

    // Case 1: Stock hit zero -> OUT_OF_STOCK_ALERT
    if (newQuantity === 0 && previousQuantity > 0) {
      // Check if alert already sent in last 6 hours to prevent spam
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const existingAlert = await NotificationModel.findOne({
        relatedEntityType: 'PRODUCT',
        relatedEntityId: product._id,
        type: 'OUT_OF_STOCK_ALERT',
        createdAt: { $gte: sixHoursAgo }
      });

      if (!existingAlert) {
        const notifications = managersAndFounders.map(user => ({
          recipientId: user._id,
          senderId: triggerUserId || null,
          type: 'OUT_OF_STOCK_ALERT',
          title: `Out of Stock: ${product.name}`,
          message: `${product.name} (SKU: ${product.sku}) is now OUT OF STOCK (0 ${product.unit.toLowerCase()}s remaining). Immediate restocking required.`,
          relatedEntityType: 'PRODUCT',
          relatedEntityId: product._id
        }));

        await NotificationModel.insertMany(notifications);

        if (triggerUserId) {
          await logProductActivity(product._id, triggerUserId, 'PRODUCT_OUT_OF_STOCK', {
            previousQuantity,
            newQuantity: 0,
            threshold
          });
        }
      }
    }
    // Case 2: Stock crossed threshold downwards -> LOW_STOCK_ALERT
    else if (newQuantity > 0 && newQuantity <= threshold && previousQuantity > threshold) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const existingAlert = await NotificationModel.findOne({
        relatedEntityType: 'PRODUCT',
        relatedEntityId: product._id,
        type: 'LOW_STOCK_ALERT',
        createdAt: { $gte: sixHoursAgo }
      });

      if (!existingAlert) {
        const notifications = managersAndFounders.map(user => ({
          recipientId: user._id,
          senderId: triggerUserId || null,
          type: 'LOW_STOCK_ALERT',
          title: `Low Stock Alert: ${product.name}`,
          message: `${product.name} (SKU: ${product.sku}) is low on stock (${newQuantity} ${product.unit.toLowerCase()}s left, threshold: ${threshold}).`,
          relatedEntityType: 'PRODUCT',
          relatedEntityId: product._id
        }));

        await NotificationModel.insertMany(notifications);

        if (triggerUserId) {
          await logProductActivity(product._id, triggerUserId, 'PRODUCT_LOW_STOCK', {
            previousQuantity,
            newQuantity,
            threshold
          });
        }
      }
    }
    // Case 3: Product was restored from 0 stock -> STOCK_RESTOCKED
    else if (previousQuantity === 0 && newQuantity > 0) {
      const notifications = managersAndFounders.map(user => ({
        recipientId: user._id,
        senderId: triggerUserId || null,
        type: 'STOCK_RESTOCKED',
        title: `Stock Restocked: ${product.name}`,
        message: `${product.name} (SKU: ${product.sku}) has been restocked to ${newQuantity} ${product.unit.toLowerCase()}s.`,
        relatedEntityType: 'PRODUCT',
        relatedEntityId: product._id
      }));

      await NotificationModel.insertMany(notifications);
    }
  } catch (err) {
    console.error('Failed to send stock alert notifications:', err);
  }
}
