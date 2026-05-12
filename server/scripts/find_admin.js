import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";

dotenv.config();

const findAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'gisign' });
        const admin = await User.findOne({ role: "superadmin" });
        if (admin) {
            console.log("Admin Email:", admin.email);
            console.log("Admin Name:", admin.name);
        } else {
            console.log("No superadmin found.");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

findAdmin();
