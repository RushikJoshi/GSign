import dotenv from "dotenv";
dotenv.config();
console.log("URI:", process.env.MONGO_URI);
console.log("DB_NAME:", process.env.MONGO_DB_NAME);
