import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const testLogin = async () => {
    try {
        const dbName = process.env.MONGO_DB_NAME || "gisign";
        await mongoose.connect(process.env.MONGO_URI, { dbName });
        
        const email = process.env.ADMIN_EMAIL || "mediamarek2025@gmail.com";
        const password = process.env.ADMIN_PASSWORD || "Admin@123";

        console.log(`Testing login for: ${email}`);
        console.log(`Using password from env: ${password}`);

        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            console.log("User not found!");
            process.exit(1);
        }

        const isMatch = await user.comparePassword(password);
        if (isMatch) {
            console.log("Password matches in database!");
        } else {
            console.log("Password does NOT match in database!");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

testLogin();
