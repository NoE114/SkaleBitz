import mongoose from "mongoose";
import { createDealModel } from "../models/Deal.js";

let dealsConnection;

export const initDealsConnection = async (uri) => {
  if (!uri) {
    console.warn("MONGO_DEALS_URI not provided. Using primary database connection for deals.");
    dealsConnection = mongoose.connection;
    return dealsConnection;
  }

  if (dealsConnection) return dealsConnection;

  dealsConnection = mongoose.createConnection(uri);
  await seedDeals(dealsConnection);
  console.log("Deals MongoDB connected");
  return dealsConnection;
};

export const getDealsConnection = () => {
  if (!dealsConnection) {
    if (mongoose.connection.readyState) {
      dealsConnection = mongoose.connection;
    } else {
      throw new Error("Deals database connection has not been initialized");
    }
  }
  return dealsConnection;
};

const seedDeals = async (connection) => {
  const Deal = createDealModel(connection);
  const count = await Deal.estimatedDocumentCount();
  if (count > 0) return;

  const now = new Date();
  await Deal.insertMany([
    {
      name: "BrightMart Supplies",
      sector: "Retail ops · Working capital",
      amount: 1500000,
      yieldPct: 11.8,
      status: "Active",
      location: "Singapore",
      tenorMonths: 12,
      risk: "On track",
      liveVolume: 3300000,
      cardVolume: 900000,
      bankVolume: 1700000,
      payoutVolume: 700000,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "AgroLink MSME",
      sector: "Agri inputs · Inventory",
      amount: 900000,
      yieldPct: 10.9,
      status: "Active",
      location: "Malaysia",
      tenorMonths: 10,
      risk: "On track",
      liveVolume: 2700000,
      cardVolume: 700000,
      bankVolume: 1500000,
      payoutVolume: 500000,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Nova Parts Co",
      sector: "Manufacturing · PO finance",
      amount: 1400000,
      yieldPct: 11.2,
      status: "Pending",
      location: "Vietnam",
      tenorMonths: 9,
      risk: "Review",
      liveVolume: 2400000,
      cardVolume: 500000,
      bankVolume: 1100000,
      payoutVolume: 800000,
      createdAt: now,
      updatedAt: now,
    },
  ]);
};