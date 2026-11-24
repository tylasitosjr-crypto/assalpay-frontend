import axiosInstance, { unwrap } from "./axiosInstance";

export const getDashboardDetails = () =>
  axiosInstance.get("/api/dashboard_details").then(unwrap);

export const getVendorProductList = (params) =>
  axiosInstance.get("/api/vendor_product_list", { params }).then(unwrap);

export const getVendorProductDetails = (params) =>
  axiosInstance.get("/api/vendor_product_details", { params }).then(unwrap);

export const addProduct = (data) =>
  axiosInstance.post("/api/add_product", data).then(unwrap);

export const editProduct = (data) =>
  axiosInstance.put("/api/edit_product", data).then(unwrap);

export const toggleProductStatus = (id) =>
  axiosInstance.put("/api/toggle_product_status", { product_id: id }).then(unwrap);

export const deleteProduct = (id) =>
  axiosInstance.delete("/api/delete_product", { data: { product_id: id } }).then(unwrap);

export const uploadProductImages = (formData) =>
  axiosInstance
    .post("/api/upload_product_images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(unwrap);

export const getCashoutList = (params) =>
  axiosInstance.get("/api/cashout_list", { params }).then(unwrap);

export const createWithdrawRequest = (data) =>
  axiosInstance.post("/api/create_withdraw_request", data).then(unwrap);

export const getMerchantWalletHub = () =>
  axiosInstance.get("/api/merchant_wallet_hub").then(unwrap);

export const getVendorOrderList = (params) =>
  axiosInstance.get("/api/vendor_order_list", { params }).then(unwrap);

export const getVendorOrderDetails = (params) =>
  axiosInstance.get("/api/vendor_order_details", { params }).then(unwrap);

export const updateOrderStatus = (data) =>
  axiosInstance.put("/api/update_order_status", data).then(unwrap);

export const addRating = (data) =>
  axiosInstance.post("/api/add_rating", data).then(unwrap);

export const getRatingList = (params) =>
  axiosInstance.get("/api/rating_list", { params }).then(unwrap);
