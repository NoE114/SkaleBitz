import api from "../api/client";
import { withRequestLock } from "./requestLock";

export const fetchProfile = async () => {
  return withRequestLock("users:me", async () => {
    const { data } = await api.get("/api/users/me");
    return data;
  });
};

export const fetchUserById = async (userId) => {
  return withRequestLock(`users:${userId}`, async () => {
    const { data } = await api.get(`/api/users/${userId}`);
    return data;
  });
};

export const updateProfile = async (payload) => {
  const { data } = await api.put("/api/users/me", payload);
  return data;
};
