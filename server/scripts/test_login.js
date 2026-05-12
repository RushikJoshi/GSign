import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || "gisign" });
        const email = "mediamarek2025@gmail.com";
        const password = "Admin@123";

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log("User not found!");
            process.exit(1);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            console.log("Password matches!");
        } else {
            console.log("Password does NOT match!");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

testLogin();
