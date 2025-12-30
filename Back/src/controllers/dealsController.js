import createError from "http-errors";
import { getDealsConnection } from "../db/dealsConnection.js";
import { createDealModel } from "../models/Deal.js";
import User from "../models/User.js";

const getDealModel = () => createDealModel(getDealsConnection());

export const listDeals = async (_req, res) => {
  const Deal = getDealModel();
  const deals = await Deal.find({ verified: true }).sort({ createdAt: -1 });
  res.json({ deals });
};

export const getDeal = async (req, res) => {
  const Deal = getDealModel();
  const deal = await Deal.findOne({ _id: req.params.id, verified: true });
  if (!deal) throw createError(404, "Deal not found");
  res.json({ deal });
};

export const createDeal = async (req, res) => {
  const Deal = getDealModel();
  const {
    businessName,
    sector,
    amount,
    yieldPct,
    status,
    location,
    tenorMonths,
    risk,
    liveVolume,
    cardVolume,
    bankVolume,
    payoutVolume,
    registeredAddress,
    contactName,
    contactEmail,
    contactPhone,
    website,
    country,
    repaymentCadence,
    doc1,
    doc2,
    doc3DirectorId,
    doc3AddressProof,
  } = req.body;

  let userRecord = null;
  if (req.user?.id) {
    userRecord = await User.findById(req.user.id);
    if (!userRecord) {
      throw createError(404, "User not found");
    }
    if (userRecord.dealId) {
      throw createError(409, "User already has a linked deal");
    }
  }

  const deal = await Deal.create({
    name: businessName || "MSME Deal",
    sector: sector || "MSME onboarding",
    amount: amount ?? 0,
    yieldPct: yieldPct ?? 0,
    status: status || "Active",
    location: location || country || registeredAddress || "",
    tenorMonths: tenorMonths ?? null,
    risk: risk || "On track",
    liveVolume: liveVolume ?? 0,
    cardVolume: cardVolume ?? 0,
    bankVolume: bankVolume ?? 0,
    payoutVolume: payoutVolume ?? 0,
    registeredAddress,
    contactName,
    contactEmail,
    contactPhone,
    website,
    country,
    repaymentCadence,
    msmeUserId: req.user?.id,
    docs: {
      doc1,
      doc2,
      doc3: {
        directorId: doc3DirectorId,
        addressProof: doc3AddressProof,
      },
    },
    verified: true,
  });

  const rollbackDeal = async () => {
    try {
      await Deal.deleteOne({ _id: deal._id });
    } catch (rollbackErr) {
      console.error("Failed to rollback deal creation", rollbackErr);
    }
  };

  if (userRecord) {
    try {
      userRecord.dealId = deal._id;
      await userRecord.save();
    } catch (err) {
      await rollbackDeal();
      throw err;
    }
  }

  res.status(201).json({ deal });
};