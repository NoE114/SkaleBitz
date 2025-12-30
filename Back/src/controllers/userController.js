import crypto from "crypto";
import createError from "http-errors";
import User from "../models/User.js";
import { APP_BASE_URL, FRONTEND_BASE_URL } from "../config/constants.js";
import { sendEmailChangeVerification } from "../utils/mailer.js";

const makeToken = () => crypto.randomBytes(32).toString("hex");

const sanitizeUser = (user) => ({
  id: user._id,
  email: user.email,
  pendingEmail: user.pendingEmail,
  name: user.name,
  about: user.about,
  avatarUrl: user.avatarUrl,
  balance: user.balance ?? 0,
  accountType: user.accountType,
  dealId: user.dealId,
  verified: user.verified,
});

const sanitizePublicUser = (user) => ({
  id: user._id,
  name: user.name,
  about: user.about,
  avatarUrl: user.avatarUrl,
  accountType: user.accountType,
  verified: user.verified,
  createdAt: user.createdAt,
});

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw createError(404, "User not found");

  res.json({ user: sanitizeUser(user) });
};

export const getProfileById = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw createError(404, "User not found");

  res.json({ user: sanitizePublicUser(user) });
};

export const updateProfile = async (req, res) => {
  const { name, about, email, avatar } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw createError(404, "User not found");

  if (typeof name === "string") {
    const trimmed = name.trim();
    if (!trimmed) throw createError(400, "Name is required");
    if (trimmed.length < 2 || trimmed.length > 100) {
      throw createError(400, "Name must be between 2 and 100 characters");
    }
    user.name = trimmed;
  }

  if (typeof about === "string") {
    const trimmed = about.trim();
    if (trimmed.length > 500) {
      throw createError(400, "Bio must be 500 characters or less");
    }
    user.about = trimmed;
  }

  if (typeof avatar === "string") {
    if (avatar) {
      if (!avatar.startsWith("data:image")) {
        throw createError(400, "Profile picture must be a valid image");
      }
      const base64 = avatar.includes(",") ? avatar.split(",")[1] : avatar;
      const sizeInBytes = Buffer.from(base64, "base64").length;
      if (sizeInBytes > 2 * 1024 * 1024) {
        throw createError(400, "Profile picture must be under 2MB");
      }
      user.avatarUrl = avatar;
    } else {
      user.avatarUrl = "";
    }
  }

  let message = "Profile updated";

  if (email && email.toLowerCase() !== user.email) {
    const desiredEmail = email.toLowerCase();
    const exists = await User.findOne({ email: desiredEmail });
    if (exists && exists._id.toString() !== user._id.toString()) {
      throw createError(409, "Email already in use");
    }

    const token = makeToken();
    user.pendingEmail = desiredEmail;
    user.emailChangeToken = token;
    user.emailChangeTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    message = "Check both email inboxes to confirm the change.";

    const verifyLink = `${APP_BASE_URL}/api/users/verify-email-change?token=${token}`;
    await sendEmailChangeVerification(user.email, desiredEmail, verifyLink);
  }

  await user.save();

  res.json({ user: sanitizeUser(user), pendingEmail: user.pendingEmail, message });
};

export const verifyEmailChange = async (req, res) => {
  const { token } = req.query;
  if (!token) throw createError(400, "Missing token");

  const user = await User.findOne({
    emailChangeToken: token,
    emailChangeTokenExpires: { $gt: new Date() },
  });
  if (!user) throw createError(400, "Invalid or expired token");

  if (!user.pendingEmail) throw createError(400, "No pending email change");

  const conflict = await User.findOne({ email: user.pendingEmail });
  if (conflict && conflict._id.toString() !== user._id.toString()) {
    throw createError(409, "Email already in use");
  }

  user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  user.emailChangeToken = undefined;
  user.emailChangeTokenExpires = undefined;
  await user.save();

  if (FRONTEND_BASE_URL) {
    return res.redirect(`${FRONTEND_BASE_URL}/login?email-changed=1`);
  }

  return res.json({ message: "Email updated successfully" });
};