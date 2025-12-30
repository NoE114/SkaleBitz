import api from "../api/client";

export const signup = async (payload) => {
  const { data } = await api.post("/api/auth/signup", payload);
  return data;
};

export const signin = async (payload) => {
  const { data } = await api.post("/api/auth/signin", payload);
  return data;
};

export const deleteAccount = async () => {
  const { data } = await api.delete("/api/auth/me");
  return data;
};

export const requestPasswordReset = async (email) => {
  const { data } = await api.post("/api/auth/forgot-password", { email });
  return data;
};

export const resetPassword = async ({ token, password }) => {
  const { data } = await api.post("/api/auth/reset-password", {
    token,
    password,
  });
  return data;
};
