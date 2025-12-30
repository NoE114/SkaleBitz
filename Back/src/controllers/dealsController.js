import createError from "http-errors";
import { getDealsConnection } from "../db/dealsConnection.js";
import { createDealModel } from "../models/Deal.js";

const getDealModel = () => createDealModel(getDealsConnection());

export const listDeals = async (_req, res) => {
  const Deal = getDealModel();
  const deals = await Deal.find().sort({ createdAt: -1 });
  res.json({ deals });
};

export const getDeal = async (req, res) => {
  const Deal = getDealModel();
  const deal = await Deal.findById(req.params.id);
  if (!deal) throw createError(404, "Deal not found");
  res.json({ deal });
};