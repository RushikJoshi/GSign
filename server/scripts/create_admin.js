import dotenv from "dotenv";
import mongoose from "mongoose";
import { ROLES } from "./src/constants/roles.js";
import { User } from "./src/models/user.model.js";

dotenv.config();

const createAdmin = async () => {
  try {
    const dbName = process.env.MONGO_DB_NAME || "signflow";
    await mongoose.connect(process.env.MONGO_URI, { dbName });

    const name = process.env.ADMIN_NAME || "SignFlow Super Admin";
    const email = (process.env.ADMIN_EMAIL || "admin@signflow.com").toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "Admin@123";

    const exists = await User.findOne({ email });
    if (exists) {
      console.log(`Superadmin already exists in '${dbName}'.`);
      process.exit(0);
    }

    await User.create({
      name,
      email,
      password,
      role: ROLES.SUPERADMIN,
      companyId: null,
      company: null,
    });

    console.log(`Superadmin created in '${dbName}'.`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();
