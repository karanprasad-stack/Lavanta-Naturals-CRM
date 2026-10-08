import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lavanta_crm';

async function runMigration() {
  console.log('Connecting to database:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const productsCollection = db.collection('products');

  console.log('Unsetting stockQuantity, lowStockThreshold, and status from products collection...');
  const result = await productsCollection.updateMany(
    {},
    {
      $unset: {
        stockQuantity: '',
        lowStockThreshold: '',
        status: ''
      }
    }
  );

  console.log(`✓ Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
