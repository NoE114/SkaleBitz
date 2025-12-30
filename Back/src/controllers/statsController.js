import { getDealsConnection } from "../db/dealsConnection.js";
import { createDealModel } from "../models/Deal.js";

const getDealModel = () => createDealModel(getDealsConnection());

export const getOverviewStats = async (_req, res) => {
  const Deal = getDealModel();

  const [summary] = await Deal.aggregate([
    {
      $group: {
        _id: null,
        activeCapital: {
          $sum: {
            $cond: [
              { $eq: [{ $toLower: { $ifNull: ["$status", ""] } }, "active"] },
              "$amount",
              0,
            ],
          },
        },
        activeDeals: {
          $sum: {
            $cond: [
              { $eq: [{ $toLower: { $ifNull: ["$status", ""] } }, "active"] },
              1,
              0,
            ],
          },
        },
        avgYield: {
          $avg: {
            $cond: [
              { $eq: [{ $toLower: { $ifNull: ["$status", ""] } }, "active"] },
              "$yieldPct",
              null,
            ],
          },
        },
        liveVolume: {
          $sum: { $ifNull: ["$liveVolume", "$amount"] },
        },
        cardVolume: { $sum: { $ifNull: ["$cardVolume", 0] } },
        bankVolume: { $sum: { $ifNull: ["$bankVolume", 0] } },
        payoutVolume: { $sum: { $ifNull: ["$payoutVolume", 0] } },
      },
    },
  ]);

  const stats = {
    activeCapital: summary?.activeCapital || 0,
    activeDeals: summary?.activeDeals || 0,
    averageYield: summary?.avgYield ? Number.parseFloat(summary.avgYield.toFixed(2)) : 0,
    liveVolume: summary?.liveVolume || 0,
    breakdown: {
      cardVolume: summary?.cardVolume || 0,
      bankVolume: summary?.bankVolume || 0,
      payoutVolume: summary?.payoutVolume || 0,
    },
  };

  if (stats.liveVolume === 0) {
    stats.liveVolume =
      stats.breakdown.cardVolume + stats.breakdown.bankVolume + stats.breakdown.payoutVolume;
  }

  const featuredDeals = await Deal.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .select("name sector amount yieldPct status location tenorMonths risk");

  res.json({ ...stats, featuredDeals });
};