import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import createError from "http-errors";
import User from "../models/User.js";
import { signupSchema, signinSchema } from "../validation/authSchemas.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/constants.js";

const signToken = (user) =>
  jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const signup = async (req, res) => {
  const { error, value } = signupSchema.validate(req.body);
  if (error) throw createError(400, error.details[0].message);

  const { email, password, name } = value;
  const exists = await User.findOne({ email });
  if (exists) throw createError(409, "Email already registered");

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password: hashed, name });
  const token = signToken(user);

  res.status(201).json({
    user: { id: user._id, email: user.email, name: user.name },
    token,
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

  const token = signToken(user);
  res.json({
    user: { id: user._id, email: user.email, name: user.name },
    token,
  });
};