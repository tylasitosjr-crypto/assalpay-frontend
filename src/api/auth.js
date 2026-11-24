import axiosInstance, { unwrap } from "./axiosInstance";

export const signup = (data) =>
  axiosInstance.post("/api/signup", data).then(unwrap);

export const verifyOtp = (data) =>
  axiosInstance.post("/api/verify_otp", data).then(unwrap);

export const resendOtp = (data) =>
  axiosInstance.post("/api/resend_otp", data).then(unwrap);

export const login = (data) =>
  axiosInstance.post("/api/login", data).then(unwrap);

export const forgotPassword = (data) =>
  axiosInstance.post("/api/forgot_password", data).then(unwrap);

export const forgotChangePassword = (data) =>
  axiosInstance.post("/api/forgot_change_password", data).then(unwrap);

export const logout = () =>
  axiosInstance.post("/api/logout").then(unwrap);

export const changePassword = (data) =>
  axiosInstance.post("/api/change_password", data).then(unwrap);

export const deleteAccount = () =>
  axiosInstance.delete("/api/delete_account").then(unwrap);

export const getProfileDetails = () =>
  axiosInstance.get("/api/profile_details").then(unwrap);

export const getProfile = getProfileDetails;

export const editProfile = (data) =>
  axiosInstance.put("/api/edit_profile", data).then(unwrap);
