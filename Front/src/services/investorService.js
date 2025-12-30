import api from "../api/client";
import { withRequestLock } from "./requestLock";

export const allocateInvestment = async (dealId, amount) => {
  const { data } = await api.post(`/api/deals/${dealId}/invest`, { amount });
  return data;
};

const fetchDealInvestorsRequest = async (dealId) => {
  const { data } = await api.get(`/api/deals/${dealId}/investors`);
  return {
    investments: data.investments || [],
    deal: data.deal || null,
  };
};

export const fetchInvestmentsByDeal = async (dealId) => {
  return withRequestLock(`investments:${dealId}`, async () => {
    const data = await fetchDealInvestorsRequest(dealId);
    return data.investments;
  });
};

export const fetchDealInvestors = async (dealId) => {
  return withRequestLock(`investors:${dealId}:full`, async () => {
    const data = await fetchDealInvestorsRequest(dealId);
    return { deal: data.deal, investors: data.investments };
  });
};
