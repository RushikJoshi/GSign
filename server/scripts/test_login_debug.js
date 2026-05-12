import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";
import fs from "fs";

dotenv.config();

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || "gisign" });
        const email = "mediamarek2025@gmail.com";
        const password = "Admin@123";

        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            fs.writeFileSync("test_login_result.txt", "User not found!", "utf8");
            process.exit(1);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            fs.writeFileSync("test_login_result.txt", "Password matches!", "utf8");
        } else {
            console.log("Found user password hash:", user.password);
            fs.writeFileSync("test_login_result.txt", "Password does NOT match! Hash: " + user.password, "utf8");
        }
        process.exit(0);
    } catch (e) {
        fs.writeFileSync("test_login_result.txt", "Error: " + e.message, "utf8");
        process.exit(1);
    }
};

testLogin();
