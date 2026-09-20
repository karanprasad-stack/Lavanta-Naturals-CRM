import { OrderModel } from '../models/Order.js';

let lastAllocatedSequence = 0;

/**
 * Generate unique human-readable order number: LN-YYYY-XXXXXX
 */
export async function generateOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `LN-${currentYear}-`;

  // Find all orders for current year and get the maximum integer sequence
  const orders = await OrderModel.find({
    orderNumber: { $regex: new RegExp(`^${prefix}`) }
  })
    .select('orderNumber')
    .lean();

  let dbMaxSequence = 0;
  for (const ord of orders) {
    if (ord.orderNumber) {
      const numPart = ord.orderNumber.replace(prefix, '');
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > dbMaxSequence) {
        dbMaxSequence = parsed;
      }
    }
  }

  const nextSequence = Math.max(dbMaxSequence, lastAllocatedSequence) + 1;
  lastAllocatedSequence = nextSequence;

  const paddedSequence = nextSequence.toString().padStart(6, '0');
  const candidateNumber = `${prefix}${paddedSequence}`;

  // Check if candidate already exists (e.g. from concurrent transactions)
  const exists = await OrderModel.findOne({ orderNumber: candidateNumber });
  if (exists) {
    lastAllocatedSequence = Math.max(lastAllocatedSequence, nextSequence) + 1;
    return `${prefix}${lastAllocatedSequence.toString().padStart(6, '0')}`;
  }

  return candidateNumber;
}
