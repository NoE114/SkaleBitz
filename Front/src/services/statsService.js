import api from "../api/client";
import { withRequestLock } from "./requestLock";

export const fetchOverviewStats = async () => {
  return withRequestLock("stats:overview", async () => {
    const { data } = await api.get("/api/stats/overview");
    return data;
  });
};

export const fetchInvestorDashboard = async () => {
  return withRequestLock("stats:investor-dashboard", async () => {
    const { data } = await api.get("/api/stats/investor-dashboard");
    return data;
  });
};

export const fetchMsmeUtilization = async () => {
  return withRequestLock("stats:msme-utilization", async () => {
    const { data } = await api.get("/api/stats/msme/utilization");
    return data;
  });
};

export const fetchInvestorDeals = async () => {
  return withRequestLock("stats:investor-deals", async () => {
    const { data } = await api.get("/api/stats/investor/deals");
    return data.deals || [];
  });
};

export const fetchInvestorLogs = async () => {
  return withRequestLock("stats:investor-logs", async () => {
    const { data } = await api.get("/api/stats/investor/logs");
    return data.logs || [];
  });
};
