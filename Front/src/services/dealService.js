import api from "../api/client";
import { withRequestLock } from "./requestLock";

export const fetchDeals = async () => {
  return withRequestLock("deals:list", async () => {
    const { data } = await api.get("/api/deals");
    return data.deals || [];
  });
};

export const fetchDealById = async (id) => {
  return withRequestLock(`deals:${id}`, async () => {
    const { data } = await api.get(`/api/deals/${id}`);
    return data.deal;
  });
};

export const fetchDealCashflows = async (id) => {
  return withRequestLock(`deals:${id}:cashflows`, async () => {
    const { data } = await api.get(`/api/deals/${id}/cashflows`);
    return data;
  });
};

export const submitMsmeDeal = async (payload) => {
  const { data } = await api.post("/api/deals", payload);
  return data.deal;
};

export const updateDealContact = async (id, payload) => {
  const { data } = await api.put(`/api/deals/${id}/contact`, payload);
  return data.deal;
};
