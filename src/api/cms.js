import axiosInstance, { unwrap } from "./axiosInstance";

export const getCms = (params) =>
  axiosInstance.get("/api/get_cms", { params }).then(unwrap);

export const getFaq = (params) =>
  axiosInstance.get("/api/get_faq", { params }).then(unwrap);

export const contactUs = (data) =>
  axiosInstance.post("/api/contact_us", data).then(unwrap);

export const bannerClick = (bannerId) =>
  axiosInstance.post("/api/banner_click", { banner_id: bannerId }).then(unwrap);

export const getCampaignList = (params) =>
  axiosInstance.get("/api/campaign_list", { params }).then(unwrap);

export const getFlashSaleProducts = (params) =>
  axiosInstance.get("/api/flash_sale_products", { params }).then(unwrap);
