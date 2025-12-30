import "dotenv/config";
import mongoose from "mongoose";
import app from "./src/app.js";
import { initDealsConnection } from "./src/db/dealsConnection.js";

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DEALS_URI = process.env.MONGO_DEALS_URI || process.env.DEALS_MONGO_URI;

const start = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is required");
    }

    await mongoose.connect(MONGO_URI);
    console.log("Primary MongoDB connected");

    if (!MONGO_DEALS_URI) {
      console.warn("MONGO_DEALS_URI not set. Using primary cluster for deals data.");
    }
    await initDealsConnection(MONGO_DEALS_URI || MONGO_URI);

    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
    } catch (err) {
    console.error("Startup error", err);
    process.exit(1);
    }
};

start();