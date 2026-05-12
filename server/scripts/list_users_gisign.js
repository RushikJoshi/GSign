import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.model.js';
import fs from 'fs';

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'gisign' });
    const users = await User.find({});
    const emails = users.map(u => u.email).join('\n');
    fs.writeFileSync('users_email.txt', emails);
    console.log('Successfully wrote users_email.txt');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

check();
