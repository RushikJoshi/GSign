import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.model.js';
import { ROLES } from './src/constants/roles.js';

dotenv.config();

const syncAdmin = async () => {
  try {
    const dbName = process.env.MONGO_DB_NAME || 'gisign';
    await mongoose.connect(process.env.MONGO_URI, { dbName });
    
    const email = (process.env.ADMIN_EMAIL || 'admin@signflow.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    // Find if user with this email exists
    let user = await User.findOne({ email });
    if (user) {
      console.log(`Admin ${email} already exists. Updating password...`);
      user.password = password;
      user.role = ROLES.SUPERADMIN; // Ensure role is superadmin
      user.isActive = true;
      await user.save();
      console.log('Admin password updated successfully.');
    } else {
      console.log(`Creating new admin: ${email}...`);
      await User.create({
        name: 'SignFlow Admin',
        email,
        password,
        role: ROLES.SUPERADMIN,
        companyId: null,
        company: null,
        isActive: true
      });
      console.log('New admin created successfully.');
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

syncAdmin();
