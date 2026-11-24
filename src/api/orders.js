import axiosInstance, { unwrap } from "./axiosInstance";

export const placeOrder = (data) =>
  axiosInstance.post("/api/place_order", data).then(unwrap);

export const getCheckoutDetails = () =>
  axiosInstance.get("/api/checkout_details").then(unwrap);

export const getOrderList = (params) =>
  axiosInstance.get("/api/order_list", { params }).then(unwrap);

export const getOrderDetails = (orderId) =>
  axiosInstance.get("/api/order_details", { params: { order_id: orderId } }).then(unwrap);

export const generateInvoice = (orderId) =>
  axiosInstance
    .get("/api/generate_invoice_pdf", {
      params: { order_id: orderId },
      responseType: "blob",
    })
    .then((res) => res.data);

export const getVendorOrderList = (params) =>
  axiosInstance.get("/api/vendor_order_list", { params }).then(unwrap);

export const getVendorOrderDetails = (orderId) =>
  axiosInstance.get("/api/vendor_order_details", { params: { order_id: orderId } }).then(unwrap);

export const updateOrderStatus = (data) =>
  axiosInstance.put("/api/update_order_status", data).then(unwrap);

export const addRating = (data) =>
  axiosInstance.post("/api/add_rating", data).then(unwrap);

export const getRatingList = (params) =>
  axiosInstance.get("/api/rating_list", { params }).then(unwrap);
