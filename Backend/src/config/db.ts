import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on('connected', () => {
      console.log('🌿 [Database] MongoDB successfully connected to', config.mongodbUri);
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ [Database] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ [Database] MongoDB disconnected');
    });

    await mongoose.connect(config.mongodbUri);
  } catch (error) {
    console.error('❌ [Database] Initial connection to MongoDB failed:', error);
    // Don't crash immediately in dev so health endpoint can report status
  }
};

export const isDbConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
  console.log('🌿 [Database] MongoDB connection closed.');
};
