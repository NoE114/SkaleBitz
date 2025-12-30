import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import dealRoutes from "./routes/deals.js";
import statsRoutes from "./routes/stats.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json({ limit: "3mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userLimiter, userRoutes);
app.use("/api/deals", userLimiter, dealRoutes);
app.use("/api/stats", statsRoutes);
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;