import axiosInstance, { unwrap } from "./axiosInstance";

export const getCartDetails = () =>
  axiosInstance.get("/api/cart_details").then(unwrap);

export const getCheckoutDetails = () =>
  axiosInstance.get("/api/checkout_details").then(unwrap);

export const addToCart = (data) =>
  axiosInstance.post("/api/add_to_cart", data).then(unwrap);

export const decrementCartItem = (data) =>
  axiosInstance.post("/api/decrement_cart_item", data).then(unwrap);

export const removeCartItem = (itemId) =>
  axiosInstance.delete("/api/remove_cart_item", { data: { item_id: itemId } }).then(unwrap);
