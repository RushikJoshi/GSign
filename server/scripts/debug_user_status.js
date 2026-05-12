import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME || "gisign" });
        const email = "mediamarek2025@gmail.com";
        const user = await User.findOne({ email }).select("+password");
        console.log("USER DATA:", JSON.stringify(user, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
