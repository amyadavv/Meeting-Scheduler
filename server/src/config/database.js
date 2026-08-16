import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export const connectDatabase = async (uri = env.MONGODB_URI) => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true // Ensure unique indexes are built
    });

    isConnected = true;

    if (!env.isTest) {
      process.stdout.write(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}\n`);
    }

    mongoose.connection.on('error', (err) => {
      process.stderr.write(`[Database Error] MongoDB connection error: ${err.message}\n`);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      if (!env.isTest) {
        process.stdout.write('[Database] MongoDB disconnected\n');
      }
    });

    return connection;
  } catch (error) {
    process.stderr.write(`[Database Error] Failed to connect to MongoDB: ${error.message}\n`);
    if (!env.isTest && env.isProduction) {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (!isConnected) {
    return;
  }
  await mongoose.disconnect();
  isConnected = false;
};
