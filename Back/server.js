import "dotenv/config";
import mongoose from "mongoose";
import app from "./src/app.js";
import { PORT as ENV_PORT } from "./src/config/constants.js";
import { initDealsConnection } from "./src/db/dealsConnection.js";

const MONGO_URI = process.env.MONGO_URI;
const PORT = ENV_PORT;

const start = async () => {
  try {
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
