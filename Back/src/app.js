import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { cacheAndDedupe, CACHE_CONTROL_VALUE } from "./middleware/cacheAndDedupe.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import dealRoutes from "./routes/deals.js";
import statsRoutes from "./routes/stats.js";
import errorHandler from "./middleware/errorHandler.js";
import { FRONTEND_BASE_URL } from "./config/constants.js";

const app = express();

const normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
};

const allowedOrigins = [normalizeOrigin(FRONTEND_BASE_URL)].filter(Boolean);
const localhostRegex = /^http:\/\/localhost(?::\d+)?$/i;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/+$/, "");
    if (localhostRegex.test(normalizedOrigin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(morgan("dev"));
app.use(compression());
app.use(express.json({ limit: "3mb" }));
app.set("etag", "strong");

app.use((req, res, next) => {
  if (req.method === "GET" && !res.getHeader("Cache-Control")) {
    res.setHeader("Cache-Control", CACHE_CONTROL_VALUE);
  }
  next();
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  // Heavy endpoints are handled earlier with stricter limits.
});

const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
});

app.use("/api", apiLimiter);

// Apply heavy protections before routing to expensive endpoints.
app.use("/api/deals", cacheAndDedupe, heavyLimiter, dealRoutes);
app.use("/api/stats", cacheAndDedupe, heavyLimiter, statsRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;
