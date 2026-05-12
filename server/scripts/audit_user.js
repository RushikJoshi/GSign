import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.model.js';

dotenv.config();

const audit = async () => {
  try {
    const dbName = process.env.MONGO_DB_NAME || 'gisign';
    await mongoose.connect(process.env.MONGO_URI, { dbName });
    
    const email = 'mediamarek2025@gmail.com';
    const user = await User.findOne({ email }).lean();
    console.log('User audit:', JSON.stringify(user, null, 2));
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

audit();
