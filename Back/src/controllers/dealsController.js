import createError from "http-errors";
import { getDealsConnection } from "../db/dealsConnection.js";
import { createDealModel } from "../models/Deal.js";
import { createInvestmentModel } from "../models/Investment.js";
import { createTransactionModel } from "../models/Transaction.js";
import { createInvestmentWithTransaction } from "../services/investmentService.js";
import User from "../models/User.js";
import { DEFAULT_TENOR_MONTHS, ensureTenorMonths } from "../utils/tenor.js";

const getDealModel = () => createDealModel(getDealsConnection());
const getInvestmentModel = () => createInvestmentModel(getDealsConnection());
const getTransactionModel = () => createTransactionModel(getDealsConnection());
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

const DAY_MS = 24 * 60 * 60 * 1000;
const cadenceToDays = (cadence) => {
  const normalized = (cadence || "").toLowerCase();
  if (normalized.includes("week")) return normalized.includes("bi") ? 14 : 7;
  if (normalized.includes("quarter")) return 90;
  if (normalized.includes("day")) return 1;
  return 30;
};

const computeCycleNumber = ({ actualDate, baseDate, cadenceDays, fallbackIndex }) => {
  if (!actualDate || !baseDate) return fallbackIndex + 1;
  if (!cadenceDays || cadenceDays <= 0) return fallbackIndex + 1;
  if (actualDate < baseDate) return 1;
  const diffMs = actualDate - baseDate;
  return Math.max(1, Math.floor(diffMs / (cadenceDays * DAY_MS)) + 1);
};

const PERCENT_TO_DECIMAL = 0.01;

const serializeInvestment = (inv) => ({
  id: inv._id,
  amount: inv.amount,
  status: inv.status,
  createdAt: inv.createdAt,
  investor: inv.investorId
    ? { id: inv.investorId._id, name: inv.investorId.name, email: inv.investorId.email }
    : null,
});

const buildRepaymentSchedule = (repayments, { cadence, startDate }) => {
  if (!Array.isArray(repayments) || repayments.length === 0) return [];

  const cadenceDays = cadenceToDays(cadence);
  const baseDate = startDate ? new Date(startDate) : null;
  const schedule = new Map();

  repayments.forEach((tx, idx) => {
    const actualDate = tx?.createdAt ? new Date(tx.createdAt) : null;
    if (!actualDate || Number.isNaN(actualDate.getTime())) return;

    const cycleNumber = computeCycleNumber({
      actualDate,
      baseDate,
      cadenceDays,
      fallbackIndex: idx,
    });

    const dueDate =
      cadenceDays > 0 ? new Date(baseDate.getTime() + cadenceDays * cycleNumber * DAY_MS) : actualDate;

    const existing = schedule.get(cycleNumber) || {
      cycle: cycleNumber,
      amount: 0,
      dueDate,
      lastRepaymentAt: actualDate,
    };

    existing.amount += Number(tx.amount || 0);
    if (!existing.lastRepaymentAt || actualDate > existing.lastRepaymentAt) {
      existing.lastRepaymentAt = actualDate;
    }

    schedule.set(cycleNumber, existing);
  });

  return Array.from(schedule.values())
    .sort((a, b) => a.cycle - b.cycle)
    .map((entry) => {
      const isLate = entry.lastRepaymentAt && entry.dueDate && entry.lastRepaymentAt > entry.dueDate;
      return {
        cycle: `Cycle ${entry.cycle}`,
        amount: entry.amount,
        date: (entry.lastRepaymentAt || entry.dueDate)?.toISOString(),
        dueDate: entry.dueDate?.toISOString(),
        status: isLate ? "Settled late" : "Settled",
      };
    });
};

const computePerformanceMetrics = ({ repayments, cadence, startDate, totalInvested, facilitySize }) => {
  const cadenceDays = cadenceToDays(cadence);
  const baseDate = startDate ? new Date(startDate) : null;
  let totalDelayDays = 0;
  let lateCount = 0;
  let countedRepayments = 0;
  const totalRepayments = (repayments || []).reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  // Round to 1 decimal place for DSO/delinquency displays
  const PRECISION_MULTIPLIER = 10;

  repayments.forEach((tx, idx) => {
    const actualDate = tx?.createdAt ? new Date(tx.createdAt) : null;
    if (!actualDate || Number.isNaN(actualDate.getTime())) return;

    const cycleNumber = computeCycleNumber({
      actualDate,
      baseDate,
      cadenceDays,
      fallbackIndex: idx,
    });
    const dueDate =
      cadenceDays > 0 ? new Date(baseDate.getTime() + cadenceDays * cycleNumber * DAY_MS) : actualDate;

    const delayDays =
      dueDate && actualDate > dueDate ? Math.floor((actualDate - dueDate) / DAY_MS) : 0;

    countedRepayments += 1;
    totalDelayDays += delayDays > 0 ? delayDays : 0;
    if (delayDays > 0) lateCount += 1;
  });

  const averageDelay = countedRepayments ? totalDelayDays / countedRepayments : 0;
  const delinquencyRate = countedRepayments ? (lateCount / countedRepayments) * 100 : 0;
  const utilizationPct =
    facilitySize && facilitySize > 0
      ? Math.min(100, Math.round(((totalInvested || 0) / facilitySize) * 100))
      : null;

  // DSO (Days Sales Outstanding) proxy: average delay of repayments vs due dates (days)
  return {
    dsoDays: Number.isFinite(averageDelay)
      ? Math.round(averageDelay * PRECISION_MULTIPLIER) / PRECISION_MULTIPLIER
      : 0,
    delinquencyRate: Number.isFinite(delinquencyRate)
      ? Math.round(delinquencyRate * PRECISION_MULTIPLIER) / PRECISION_MULTIPLIER
      : 0,
    moic:
      totalInvested && totalInvested > 0
        ? Math.round((totalRepayments / totalInvested) * 100) / 100
        : null,
    utilizationPct,
  };
};

export const listDeals = async (_req, res) => {
  const Deal = getDealModel();
    const Investment = getInvestmentModel();
  const deals = await Deal.find({ verified: true }).sort({ createdAt: -1 }).lean();
  const utilizationMap = await buildUtilizationMap(
    deals.map((deal) => deal._id),
    Investment
  );

  res.json({
    deals: deals.map((deal) => {
      const facilitySize = resolveFacilitySize(deal);
      const utilizedAmount = utilizationMap.get(String(deal._id)) || 0;
      return ensureTenorMonths({
        ...deal,
        facilitySize,
        utilizedAmount,
        remainingCapacity: Math.max(0, facilitySize - utilizedAmount),
      });
    }),
  });
};

export const getDeal = async (req, res) => {
  const Deal = getDealModel();
  const Investment = getInvestmentModel();
  const Transaction = getTransactionModel();

  const deal = await Deal.findOne({ _id: req.params.id, verified: true });
  if (!deal) throw createError(404, "Deal not found");

  const dealId = deal._id;
  const investments = await Investment.find({ dealId }).sort({ createdAt: 1 }).lean();
  const investmentIds = investments.map((inv) => inv._id);
  const utilizedAmount = investments.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const facilitySize = resolveFacilitySize(deal);
  const remainingCapacity = Math.max(0, facilitySize - utilizedAmount);

  let transactions = [];
  if (investmentIds.length) {
    transactions = await Transaction.find({ investmentId: { $in: investmentIds } })
      .sort({ createdAt: 1 })
      .lean();
  }

  const repaymentTxs = transactions.filter((tx) => tx.type === "repayment");
  const inflows = repaymentTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const outflows = transactions
    .filter((tx) => tx.type === "invest")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const startDate = investments[0]?.createdAt || deal.createdAt;
  const cashflows = buildRepaymentSchedule(repaymentTxs, {
    cadence: deal.repaymentCadence,
    startDate,
  });

  const performance = computePerformanceMetrics({
    repayments: repaymentTxs,
    cadence: deal.repaymentCadence,
    startDate,
    totalInvested: utilizedAmount,
    facilitySize,
  });

    const dealPayload = ensureTenorMonths(deal);

  res.json({
    deal: {
      ...dealPayload,
      facilitySize,
      utilizedAmount,
      remainingCapacity,
      inflows,
      outflows,
      cashflows,
      performance,
    },
  });
};

export const getDealCashflows = async (req, res, next) => {
  try {
    const Deal = getDealModel();
    const Investment = getInvestmentModel();
    const Transaction = getTransactionModel();

    const deal = await Deal.findOne({ _id: req.params.id, verified: true });
    if (!deal) throw createError(404, "Deal not found");

    const investments = await Investment.find({ dealId: deal._id }).sort({ createdAt: 1 }).lean();
    const investmentIds = investments.map((inv) => inv._id);

    const cadenceDays = cadenceToDays(deal.repaymentCadence);

    let repayments = [];
    if (investmentIds.length) {
      repayments = await Transaction.find({
        investmentId: { $in: investmentIds },
        type: "repayment",
      })
        .sort({ createdAt: 1 })
        .lean();
    }

    let baseDate = investments[0]?.createdAt || repayments[0]?.createdAt || deal.createdAt;
    let principalTotal = 0;
    let yieldTotal = 0;

    const payouts = repayments
      .map((tx, idx) => {
        const actualDate = tx?.createdAt ? new Date(tx.createdAt) : null;
        const cycleNumber = computeCycleNumber({
          actualDate,
          baseDate: baseDate ? new Date(baseDate) : null,
          cadenceDays,
          fallbackIndex: idx,
        });
        const principal = Number(tx.amount || 0);
        const yieldAmount = principal * Number(deal.yieldPct || 0) * PERCENT_TO_DECIMAL;
        principalTotal += principal;
        yieldTotal += yieldAmount;
        return {
          id: tx._id,
          cycleNumber,
          date: tx.createdAt,
          principal,
          yield: yieldAmount,
          status: "Settled",
        };
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .map((entry) => ({
        ...entry,
        cycle: `Cycle ${entry.cycleNumber || 1}`,
      }));

    res.json({
      deal: {
        id: deal._id,
        name: deal.name,
        yieldPct: deal.yieldPct,
      },
      payouts,
      totals: {
        principal: principalTotal,
        yield: yieldTotal,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const listDealInvestments = async (req, res) => {
  const Deal = getDealModel();
  const Investment = getInvestmentModel();

  const deal = await Deal.findOne({ _id: req.params.id, verified: true });
  if (!deal) throw createError(404, "Deal not found");

  try {
    const investments = await Investment.find({ dealId: deal._id })
      .sort({ createdAt: -1 })
      .populate({ path: "investorId", select: "name email" })
      .lean();

    res.json({
      investments: investments.map(serializeInvestment),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to list deal investments", err);
    }
    throw createError(500, "Unable to load investments");
  }
};

export const listDealInvestors = async (req, res) => {
  const Deal = getDealModel();
  const Investment = getInvestmentModel();

  try {
    const deal = await Deal.findOne({ _id: req.params.id, verified: true }).lean();
    if (!deal) throw createError(404, "Deal not found");

    const user = await User.findById(req.user?.id).select("_id accountType").lean();
    if (!user || user.accountType !== "msme") {
      throw createError(403, "You are not authorized to view investors for this deal");
    }

    if (!deal.msmeUserId || String(deal.msmeUserId) !== String(user._id)) {
      throw createError(403, "You can only view investors for your own deals");
    }

    const investments = await Investment.find({ dealId: deal._id })
      .sort({ createdAt: -1 })
      .populate({ path: "investorId", select: "name email" })
      .lean();

    res.json({
      deal: { id: deal._id, name: deal.name },
      investments: investments.map(serializeInvestment),
    });
  } catch (err) {
    if (err.status) {
      throw err;
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to list deal investors", err);
    }
    throw createError(500, "Unable to load investors");
  }
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
    facilitySize: facilitySizeInput,
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

    const normalizedAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const normalizedFacilitySize = Number.isFinite(Number(facilitySizeInput))
    ? Number(facilitySizeInput)
    : normalizedAmount || 10000;
  const finalAmount = normalizedAmount || normalizedFacilitySize;

  const deal = await Deal.create({
    name: businessName || "MSME Deal",
    sector: sector || "MSME onboarding",
    amount: finalAmount,
    facilitySize: normalizedFacilitySize,
    utilizedAmount: 0,
    yieldPct: yieldPct ?? 0,
    status: status || "Active",
    location: location || country || registeredAddress || "",
    tenorMonths: tenorMonths ?? DEFAULT_TENOR_MONTHS,
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

export const investInDeal = async (req, res) => {
  const dealId = req.params.id;
  const amount = Number(req.body?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError(400, "Amount must be a positive number");
  }

  const { investment, investor } = await createInvestmentWithTransaction({
    dealId,
    investorId: req.user.id,
    amount,
  });

  res.status(201).json({ investment, user: sanitizeUser(investor) });
};