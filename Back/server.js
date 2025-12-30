import "dotenv/config";
import mongoose from "mongoose";
import app from "./src/app.js";
import { APP_BASE_URL, FRONTEND_BASE_URL, PORT as ENV_PORT } from "./src/config/constants.js";
import { initDealsConnection } from "./src/db/dealsConnection.js";

const MONGO_URI = process.env.MONGO_URI;
const PORT = ENV_PORT;

const start = async () => {
  try {
    if (!PORT) {
      throw new Error("PORT is required");
    }
    if (!APP_BASE_URL) {
      throw new Error("APP_BASE_URL is required");
    }
    if (!FRONTEND_BASE_URL) {
      throw new Error("FRONTEND_BASE_URL is required");
    }
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is required");
    }

    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
    await initDealsConnection();

    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error("Startup error", err);
    process.exit(1);
  }
};

start();
