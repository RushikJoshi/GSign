import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const fixUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || "gisign" });
        const user = await User.findOne({ email: "mediamarek2025@gmail.com" });
        if (user) {
            user.role = "superadmin"; // Fix the role to superadmin
            await user.save();
            console.log("Successfully updated mediamarek2025@gmail.com to superadmin role.");
        } else {
            console.log("User not found.");
        }
        process.exit(0);
    } catch (e) {
        console.error("Error during update:", e.message);
        process.exit(1);
    }
};

fixUser();
