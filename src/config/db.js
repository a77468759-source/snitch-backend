import mongoose from "mongoose";
import config from "./config.js";

const { MONGO_URI } = config;

export async function connectToDB() {
    await mongoose.connect(MONGO_URI);
    console.log("mongodb connected successfully");
}