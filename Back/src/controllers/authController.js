import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import createError from "http-errors";
import User from "../models/User.js";
import { signupSchema, signinSchema } from "../validation/authSchemas.js";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  FRONTEND_BASE_URL,
  buildBackendUrl,
  buildFrontendUrl,
} from "../config/constants.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/mailer.js";

const signToken = (user) =>
  jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const makeVerifyToken = () => crypto.randomBytes(32).toString("hex");

export const signup = async (req, res) => {
  const { error, value } = signupSchema.validate(req.body);
  if (error) throw createError(400, error.details[0].message);

  const { email, password, name, accountType, termsAccepted } = value;
  const exists = await User.findOne({ email });
  if (exists) throw createError(409, "Email already registered");

  const hashed = await bcrypt.hash(password, 12);
  const token = makeVerifyToken();
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const user = await User.create({
    email,
    password: hashed,
    name,
    accountType,
    termsAccepted,
    termsAcceptedAt: termsAccepted ? new Date() : undefined,
    verified: false,
    verificationToken: token,
    verificationTokenExpires: tokenExpiry,
  });

  const verifyLink = buildBackendUrl(`/api/auth/verify?token=${token}`);
  await sendVerificationEmail(email, verifyLink);

  res.status(201).json({
    message: "Signup successful. Check your email to verify your account.",
  });
};

export const signin = async (req, res) => {
  const { error, value } = signinSchema.validate(req.body);
  if (error) throw createError(400, error.details[0].message);

  const { email, password } = value;
  const user = await User.findOne({ email });
  if (!user) throw createError(401, "Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw createError(401, "Invalid credentials");

  if (!user.verified) throw createError(403, "Please verify your email first");

  const token = signToken(user);
  res.json({
    user: {
      id: user._id,
      email: user.email,
      pendingEmail: user.pendingEmail,
      name: user.name,
      about: user.about,
      avatarUrl: user.avatarUrl,
      balance: user.balance ?? 0,
      accountType: user.accountType,
      dealId: user.dealId,
    },
    token,
  });
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) throw createError(400, "Missing token");

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
  });
  if (!user) throw createError(400, "Invalid or expired token");

  user.verified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  // Redirect to the SPA login route when a frontend base is configured.
  if (FRONTEND_BASE_URL) {
    return res.redirect(buildFrontendUrl("/login?verified=1"));
  }

  return res.json({ message: "Email verified. You can now sign in." });
};

// Optional: resend verification
export const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) throw createError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw createError(404, "User not found");
  if (user.verified) return res.json({ message: "Already verified" });

  const token = makeVerifyToken();
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
  user.verificationToken = token;
  user.verificationTokenExpires = tokenExpiry;
  await user.save();

  const verifyLink = buildBackendUrl(`/api/auth/verify?token=${token}`);
  await sendVerificationEmail(email, verifyLink);

  res.json({ message: "Verification email sent" });
};

export const deleteAccount = async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.user.id);
    if (!deleted) throw createError(404, "Account not found");
    res.json({ message: "Account deleted" });
  } catch (err) {
    next(err);
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) throw createError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: "If that account exists, we've emailed reset instructions." });
  }

  const token = makeVerifyToken();
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetLink = buildFrontendUrl(`/reset/confirm?token=${token}`);
  await sendPasswordResetEmail(email, resetLink);

  res.json({ message: "If that account exists, we've emailed reset instructions." });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw createError(400, "Token and password are required");
  if (password.length < 8 || password.length > 128) {
    throw createError(400, "Password must be between 8 and 128 characters");
  }

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) throw createError(400, "Invalid or expired token");

  const hashed = await bcrypt.hash(password, 12);
  user.password = hashed;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: "Password updated successfully" });
};
