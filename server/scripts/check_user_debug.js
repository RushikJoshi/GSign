import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";
import fs from "fs";

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || "gisign" });
        const user = await User.findOne({ email: "mediamarek2025@gmail.com" });
        if (user) {
            fs.writeFileSync("user_debug.json", JSON.stringify(user, null, 2), "utf8");
        } else {
            fs.writeFileSync("user_debug.json", "User not found", "utf8");
        }
        process.exit(0);
    } catch (e) {
        fs.writeFileSync("user_debug.json", "Error: " + e.message, "utf8");
        process.exit(1);
    }
};

checkUser();
