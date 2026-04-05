import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || "gisign" });
        const email = "mediamarek2025@gmail.com";
        const result = await User.updateOne({ email }, { $set: { isActive: true } });
        console.log("UPDATE RESULT:", result);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

fix();
