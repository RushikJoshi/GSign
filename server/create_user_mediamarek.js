import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { User } from './src/models/user.model.js';
import { ROLES } from './src/constants/roles.js';

dotenv.config();

// Use public DNS so SRV lookup to Atlas doesn't get ECONNREFUSED locally.
const dnsServers = process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1';
dns.setServers(
  dnsServers
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

const create = async () => {
  try {
    const dbName = process.env.MONGO_DB_NAME || 'gisign';
    await mongoose.connect(process.env.MONGO_URI, {
      dbName,
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS || 10000),
      connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 10000),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 20000),
      family: Number(process.env.MONGO_DNS_FAMILY || 4),
    });
    
    const email = process.env.ADMIN_EMAIL || 'mediamarek2025@gmail.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    // Check if exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('User already exists. Updating password...');
      existing.password = password;
      await existing.save();
      console.log('Password updated.');
    } else {
      await User.create({
        name: 'Media Marek',
        email,
        password,
        role: ROLES.SUPERADMIN,
        companyId: null,
        company: null
      });
      console.log('User created successfully as SuperAdmin.');
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

create();
