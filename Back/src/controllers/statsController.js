import mongoose from "mongoose";
import { getDealsConnection } from "../db/dealsConnection.js";
import { createDealModel } from "../models/Deal.js";
import { createInvestmentModel } from "../models/Investment.js";
import { createTransactionModel } from "../models/Transaction.js";
import { ensureTenorMonths } from "../utils/tenor.js";

const getDealModel = () => createDealModel(getDealsConnection());
const getInvestmentModel = () => createInvestmentModel(getDealsConnection());
const getTransactionModel = () => createTransactionModel(getDealsConnection());
const ACTIVE_STATUS = "Active";

const resolveFacilitySize = (deal) => {
  const raw = Number(deal?.facilitySize ?? deal?.amount ?? 10000);
  return Number.isFinite(raw) && raw > 0 ? raw : 10000;
};

const buildUtilizationMap = async (dealIds, Investment) => {
  if (!Array.isArray(dealIds) || dealIds.length === 0) return new Map();
  const utilization = await Investment.aggregate([
    { $match: { dealId: { $in: dealIds } } },
    { $group: { _id: "$dealId", total: { $sum: "$amount" } } },
  ]);
  return new Map(utilization.map((entry) => [String(entry._id), entry.total || 0]));
};

export const getOverviewStats = async (_req, res) => {
  const Deal = getDealModel();
  const Investment = getInvestmentModel();
  const facilityField = { $ifNull: ["$facilitySize", { $ifNull: ["$amount", 10000] }] };

  const [summary] = await Deal.aggregate([
    {
      $match: { verified: true },
    },
    {
      $group: {
        _id: null,
        activeCapital: {
          $sum: {
            $cond: [
              { $eq: [{ $toLower: { $ifNull: ["$status", ""] } }, "active"] },
              facilityField,
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
          $sum: { $ifNull: ["$liveVolume", facilityField] },
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

  let featuredDeals = await Deal.find({
    status: { $regex: /^active$/i },
    verified: true,
  })
    .sort({ yieldPct: -1, facilitySize: -1, amount: -1, createdAt: -1 })
    .limit(3)
    .select("name sector amount facilitySize yieldPct status location tenorMonths risk liveVolume")
    .lean();

  if (featuredDeals.length === 0) {
    featuredDeals = await Deal.find({ verified: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("name sector amount facilitySize yieldPct status location tenorMonths risk liveVolume")
      .lean();
  }

    const utilizationMap = await buildUtilizationMap(
    featuredDeals.map((deal) => deal._id),
    Investment
  );

  featuredDeals = featuredDeals.map((deal) => {
    const facilitySize = resolveFacilitySize(deal);
    const utilizedAmount = utilizationMap.get(String(deal._id)) || 0;
    return ensureTenorMonths({
      ...deal,
      facilitySize,
      utilizedAmount,
      remainingCapacity: Math.max(0, facilitySize - utilizedAmount),
    });
  });

  res.json({ ...stats, featuredDeals });
};

export const getMsmeUtilization = async (req, res, next) => {
  try {
    const msmeId = req.user?.id;
    const msmeObjectId =
      msmeId && mongoose.Types.ObjectId.isValid(msmeId) ? new mongoose.Types.ObjectId(msmeId) : null;

    if (!msmeObjectId) {
      return res.json({ utilized: 0, deals: 0 });
    }

    const Deal = getDealModel();
    const Investment = getInvestmentModel();

    const deals = await Deal.find({
      msmeUserId: msmeObjectId,
      status: ACTIVE_STATUS,
      verified: true,
    })
      .select("_id")
      .lean();

    if (!deals.length) {
      return res.json({ utilized: 0, deals: 0 });
    }

    const dealIds = deals.map((deal) => deal._id);
    const [summary] = await Investment.aggregate([
      { $match: { dealId: { $in: dealIds } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({ utilized: summary?.total || 0, deals: dealIds.length });
  } catch (err) {
    next(err);
  }
};

export const getInvestorDashboard = async (req, res, next) => {
  try {
    const investorId = req.user?.id;
    const investorObjectId =
      investorId && mongoose.Types.ObjectId.isValid(investorId)
        ? new mongoose.Types.ObjectId(investorId)
        : null;

    const Investment = getInvestmentModel();
    const Transaction = getTransactionModel();

    const investments = investorObjectId
      ? await Investment.find({ investorId: investorObjectId })
          .populate({ path: "dealId", select: "name sector yieldPct status" })
          .sort({ createdAt: -1 })
          .lean()
      : [];

    let totalInvested = 0;
    let weightedYield = 0;
    const dealIds = new Set();
    const allocationMap = new Map();

    investments.forEach((investment) => {
      const amount = Number(investment.amount || 0);
      const deal = investment.dealId || {};
      const sector = deal.sector || "Unspecified";

      totalInvested += amount;
      weightedYield += amount * Number(deal.yieldPct || 0);
      if (deal?._id) {
        dealIds.add(String(deal._id));
      }
      allocationMap.set(sector, (allocationMap.get(sector) || 0) + amount);
    });

    const averageYield = totalInvested > 0 ? weightedYield / totalInvested : 0;
    const allocation = Array.from(allocationMap.entries())
      .map(([sector, amount]) => ({
        sector,
        amount,
        percent: totalInvested > 0 ? (amount / totalInvested) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const recentDeals = investments.slice(0, 5).map((investment) => ({
      investmentId: investment._id,
      dealId: investment.dealId?._id || null,
      name: investment.dealId?.name || "Deal",
      sector: investment.dealId?.sector || "—",
      amount: investment.amount || 0,
      status: investment.dealId?.status || "Active",
      createdAt: investment.createdAt,
    }));

    let activity = [];
    if (investments.length) {
      const investmentIds = investments.map((inv) => inv._id);
      const transactions = await Transaction.find({ investmentId: { $in: investmentIds } })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const dealNameByInvestment = new Map(
        investments.map((inv) => [String(inv._id), inv.dealId?.name || "Deal"])
      );

      activity = transactions.map((tx) => ({
        id: tx._id,
        investmentId: tx.investmentId,
        dealName: dealNameByInvestment.get(String(tx.investmentId)) || "Deal",
        amount: tx.amount,
        type: tx.type,
        createdAt: tx.createdAt,
      }));
    }

    const YIELD_ROUND_SCALE = 100;

    res.json({
      totalInvested,
      averageYield: Math.round(averageYield * YIELD_ROUND_SCALE) / YIELD_ROUND_SCALE,
      activeDeals: dealIds.size,
      allocation,
      recentDeals,
      activity,
    });
  } catch (err) {
    next(err);
  }
};

export const getInvestorDeals = async (req, res, next) => {
  try {
    const investorId = req.user?.id;
    const investorObjectId =
      investorId && mongoose.Types.ObjectId.isValid(investorId)
        ? new mongoose.Types.ObjectId(investorId)
        : null;

    if (!investorObjectId) {
      return res.json({ deals: [] });
    }

    const Investment = getInvestmentModel();
    const Deal = getDealModel();

    const investments = await Investment.find({ investorId: investorObjectId })
      .sort({ createdAt: -1 })
      .populate({
        path: "dealId",
        select: "name sector amount yieldPct status location tenorMonths risk repaymentCadence verified",
      })
      .lean();

    const dealsById = new Map();

    investments.forEach((inv) => {
      const deal = inv.dealId;
      if (!deal) return;
      const key = String(deal._id);
      const normalizedDeal = ensureTenorMonths(deal);
      const existing = dealsById.get(key) || {
        id: deal._id,
        name: normalizedDeal.name,
        sector: normalizedDeal.sector,
        amount: normalizedDeal.amount,
        yieldPct: normalizedDeal.yieldPct,
        status: normalizedDeal.status,
        location: normalizedDeal.location,
        tenorMonths: normalizedDeal.tenorMonths,
        risk: normalizedDeal.risk,
        repaymentCadence: normalizedDeal.repaymentCadence,
        invested: 0,
        lastAllocationAt: inv.createdAt,
      };
      existing.invested += Number(inv.amount || 0);
      if (inv.createdAt && (!existing.lastAllocationAt || inv.createdAt > existing.lastAllocationAt)) {
        existing.lastAllocationAt = inv.createdAt;
      }
      dealsById.set(key, existing);
    });

    const deals = Array.from(dealsById.values()).sort(
      (a, b) => new Date(b.lastAllocationAt || 0) - new Date(a.lastAllocationAt || 0)
    );

        const utilizationMap = await buildUtilizationMap(
      deals
        .map((deal) => (deal.id && mongoose.Types.ObjectId.isValid(deal.id) ? new mongoose.Types.ObjectId(deal.id) : null))
        .filter(Boolean),
      Investment
    );

    const enrichedDeals = deals.map((deal) => {
      const facilitySize = resolveFacilitySize(deal);
      const utilizedAmount = utilizationMap.get(String(deal.id)) || 0;
      return {
        ...deal,
        facilitySize,
        utilizedAmount,
        remainingCapacity: Math.max(0, facilitySize - utilizedAmount),
      };
    });

    res.json({ deals: enrichedDeals });
  } catch (err) {
    next(err);
  }
};

export const getInvestorLogs = async (req, res, next) => {
  try {
    const investorId = req.user?.id;
    const investorObjectId =
      investorId && mongoose.Types.ObjectId.isValid(investorId)
        ? new mongoose.Types.ObjectId(investorId)
        : null;

    if (!investorObjectId) {
      return res.json({ logs: [] });
    }

    const Transaction = getTransactionModel();
    const Investment = getInvestmentModel();

    const transactions = await Transaction.find({
      $or: [{ fromUserId: investorObjectId }, { toUserId: investorObjectId }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const investmentIds = transactions
      .map((tx) => tx.investmentId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    let investments = [];
    if (investmentIds.length) {
      investments = await Investment.find({ _id: { $in: investmentIds } })
        .populate({ path: "dealId", select: "name" })
        .lean();
    }

    const dealNameByInvestment = new Map(
      investments.map((inv) => [String(inv._id), inv.dealId?.name || "Deal"])
    );

    const logs = transactions.map((tx) => ({
      id: tx._id,
      investmentId: tx.investmentId,
      dealName: dealNameByInvestment.get(String(tx.investmentId)) || "Deal",
      amount: tx.amount,
      type: tx.type,
      createdAt: tx.createdAt,
      direction:
        tx.fromUserId && String(tx.fromUserId) === String(investorObjectId) ? "outgoing" : "incoming",
    }));

    res.json({ logs });
  } catch (err) {
    next(err);
  }
};