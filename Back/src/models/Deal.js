import mongoose from "mongoose";
import { DEFAULT_TENOR_MONTHS } from "../utils/tenor.js";

const dealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    msmeUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sector: { type: String, trim: true },
    registeredAddress: { type: String, trim: true },
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    website: { type: String, trim: true },
    country: { type: String, trim: true },
    repaymentCadence: { type: String, trim: true },
    facilitySize: { type: Number, default: 10000 },
    utilizedAmount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    yieldPct: { type: Number, required: true },
    status: { type: String, default: "Active" },
    location: { type: String, trim: true },
    tenorMonths: { type: Number, default: DEFAULT_TENOR_MONTHS },
    risk: { type: String, default: "On track" },
    liveVolume: { type: Number, default: 0 },
    cardVolume: { type: Number, default: 0 },
    bankVolume: { type: Number, default: 0 },
    payoutVolume: { type: Number, default: 0 },
    memoUrl: { type: String },
    docs: {
      doc1: { type: String, trim: true },
      doc2: { type: String, trim: true },
      doc3: {
        directorId: { type: String, trim: true },
        addressProof: { type: String, trim: true },
      },
    },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const createDealModel = (connection) => connection.models.Deal || connection.model("Deal", dealSchema);