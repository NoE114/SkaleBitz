import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    about: { type: String, trim: true, default: "" },
    avatarUrl: { type: String },
    balance: { type: Number, default: 0 },
    accountType: { type: String, enum: ["investor", "msme"], required: true },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal", default: null },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    pendingEmail: { type: String, lowercase: true, trim: true },
    emailChangeToken: { type: String },
    emailChangeTokenExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);