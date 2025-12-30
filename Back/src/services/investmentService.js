import createError from "http-errors";
import { getDealsConnection } from "../db/dealsConnection.js";
import { createInvestmentModel } from "../models/Investment.js";
import { createDealModel } from "../models/Deal.js";
import {
  createTransactionModel,
  TRANSACTION_TYPES,
} from "../models/Transaction.js";
import User from "../models/User.js";

const getInvestmentModel = () => createInvestmentModel(getDealsConnection());
const getTransactionModel = () => createTransactionModel(getDealsConnection());
const getDealModel = () => createDealModel(getDealsConnection());
const NON_REPLICA_SET_CODE = 20;
const NON_REPLICA_TRANSACTION_MESSAGE =
  "Transaction numbers are only allowed on a replica set member";
const REPAYMENT_TYPES = TRANSACTION_TYPES.filter((type) => type !== "invest");
const logRollbackFailure = (message, error) => {
  console.error(message, error);
};

const resolveFacilitySize = (deal) => {
  const raw = Number(deal?.facilitySize ?? deal?.amount ?? 10000);
  return Number.isFinite(raw) && raw > 0 ? raw : 10000;
};

const getUtilizedAmount = async (Investment, dealId, session) => {
  if (!dealId) return 0;
  const pipeline = [
    { $match: { dealId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ];
  const agg = session ? Investment.aggregate(pipeline).session(session) : Investment.aggregate(pipeline);
  const [result] = await agg;
  return result?.total || 0;
};

const createInvestmentWithoutSession = async (
  { dealId, investorId, amount, status, toUserId: requestedToUserId },
  Investment,
  Transaction,
  Deal
) => {
  const investor = await User.findById(investorId);
  if (!investor) {
    throw createError(404, "Investor not found");
  }
  if (investor.accountType !== "investor") {
    throw createError(403, "Only investors can allocate funds");
  }
  if ((investor.balance ?? 0) < amount) {
    throw createError(400, "Insufficient balance");
  }

  const deal = await Deal.findOne({ _id: dealId, verified: true });
  if (!deal) {
    throw createError(404, "Deal not found");
  }

  const facilitySize = resolveFacilitySize(deal);
  const currentUtilized = await getUtilizedAmount(Investment, deal._id);
  await Deal.updateOne({ _id: deal._id }, { $set: { utilizedAmount: currentUtilized } });
  const capacityResult = await Deal.updateOne(
    {
      _id: deal._id,
      verified: true,
      $expr: { $lte: [{ $add: ["$utilizedAmount", amount] }, { $literal: facilitySize }] },
    },
    { $inc: { utilizedAmount: amount } }
  );
  if (!capacityResult.modifiedCount) {
    throw createError(400, "Investment exceeds facility size");
  }

  const toUserId = requestedToUserId || deal.msmeUserId || investorId;
  investor.balance = (investor.balance ?? 0) - amount;
  await investor.save();

  const investmentRecord = await Investment.create({
    dealId,
    investorId,
    amount,
    status,
  });

  try {
    await Transaction.create({
      investmentId: investmentRecord._id,
      fromUserId: investorId,
      toUserId,
      amount,
      type: "invest",
    });
  } catch (err) {
    try {
      await Investment.deleteOne({ _id: investmentRecord._id });
    } catch (rollbackErr) {
      logRollbackFailure(
        "Failed to rollback investment after transaction error",
        rollbackErr
      );
    }
    try {
      investor.balance += amount;
      await investor.save();
    } catch (rollbackErr) {
      logRollbackFailure(
        "Failed to rollback investor balance after transaction error",
        rollbackErr
      );
    }
    throw err;
  }

  return { investment: investmentRecord, investor };
};

const recordRepaymentWithoutSession = async (
  { investmentId, fromUserId, toUserId, amount, type },
  Investment,
  Transaction
) => {
  const investment = await Investment.findById(investmentId);
  if (!investment) {
    throw createError(404, "Investment not found");
  }

  return Transaction.create({
    investmentId,
    fromUserId,
    toUserId,
    amount,
    type,
  });
};

export const createInvestmentWithTransaction = async ({
  dealId,
  investorId,
  amount,
  toUserId: requestedToUserId,
  status = "active",
}) => {
  if (!dealId || !investorId) {
    throw createError(400, "dealId and investorId are required");
  }
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    throw createError(400, "amount must be a positive number");
  }

  const Investment = getInvestmentModel();
  const Transaction = getTransactionModel();
  const Deal = getDealModel();
  const connection = getDealsConnection();
  const session = await connection.startSession();
  let investmentRecord;
  let updatedInvestor;
  try {
    await session.withTransaction(async () => {
      const investor = await User.findById(investorId).session(session);
      if (!investor) {
        throw createError(404, "Investor not found");
      }
      if (investor.accountType !== "investor") {
        throw createError(403, "Only investors can allocate funds");
      }
      if ((investor.balance ?? 0) < amount) {
        throw createError(400, "Insufficient balance");
      }

      const deal = await Deal.findOne({ _id: dealId, verified: true }).session(
        session
      );
      if (!deal) {
        throw createError(404, "Deal not found");
      }
           const facilitySize = resolveFacilitySize(deal);
      const currentUtilized = await getUtilizedAmount(Investment, deal._id, session);
      await Deal.updateOne(
        { _id: deal._id },
        { $set: { utilizedAmount: currentUtilized } },
        { session }
      );
      const capacityResult = await Deal.updateOne(
        {
          _id: deal._id,
          verified: true,
          $expr: { $lte: [{ $add: ["$utilizedAmount", amount] }, { $literal: facilitySize }] },
        },
        { $inc: { utilizedAmount: amount } },
        { session }
      );
      if (!capacityResult.modifiedCount) {
        throw createError(400, "Investment exceeds facility size");
      }

      const toUserId = requestedToUserId || deal.msmeUserId || investorId;
      investor.balance = (investor.balance ?? 0) - amount;
      await investor.save({ session });
      updatedInvestor = investor;

      const [investment] = await Investment.create(
        [{ dealId, investorId, amount, status }],
        { session }
      );
      investmentRecord = investment;

      await Transaction.create(
        [
          {
            investmentId: investment._id,
            fromUserId: investorId,
            toUserId,
            amount,
            type: "invest",
          },
        ],
        { session }
      );
    });
  } catch (err) {
    if (
      err?.code === NON_REPLICA_SET_CODE ||
      err?.message?.includes(NON_REPLICA_TRANSACTION_MESSAGE)
    ) {
      return createInvestmentWithoutSession(
        { dealId, investorId, amount, status, toUserId: requestedToUserId },
        Investment,
        Transaction,
        Deal
      );
    }
    throw err;
  } finally {
    await session.endSession();
  }

  return { investment: investmentRecord, investor: updatedInvestor };
};

export const recordRepaymentTransaction = async ({
  investmentId,
  fromUserId,
  toUserId,
  amount,
  type = "repayment",
}) => {
  if (!investmentId) {
    throw createError(400, "investmentId is required");
  }
  if (!fromUserId || !toUserId) {
    throw createError(400, "fromUserId and toUserId are required");
  }
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    throw createError(400, "amount must be a positive number");
  }
  if (!REPAYMENT_TYPES.includes(type)) {
    throw createError(400, "Invalid transaction type");
  }

  const Investment = getInvestmentModel();
  const Transaction = getTransactionModel();

  const connection = getDealsConnection();
  const session = await connection.startSession();
  let transactionRecord;

  try {
    await session.withTransaction(async () => {
      const investment = await Investment.findById(investmentId).session(
        session
      );
      if (!investment) {
        throw createError(404, "Investment not found");
      }

      const [createdTransaction] = await Transaction.create(
        [
          {
            investmentId,
            fromUserId,
            toUserId,
            amount,
            type,
          },
        ],
        { session }
      );
      transactionRecord = createdTransaction;
    });
  } catch (err) {
    if (
      err?.code === NON_REPLICA_SET_CODE ||
      err?.message?.includes(NON_REPLICA_TRANSACTION_MESSAGE)
    ) {
      return recordRepaymentWithoutSession(
        { investmentId, fromUserId, toUserId, amount, type },
        Investment,
        Transaction
      );
    }
    throw err;
  } finally {
    await session.endSession();
  }

  return transactionRecord;
};
