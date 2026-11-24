import axiosInstance, { unwrap } from "./axiosInstance";

export const getUserWishlist = (params) =>
  axiosInstance.get("/api/user_wishlist", { params }).then(unwrap);

export const toggleWishlistProduct = (productId) =>
  axiosInstance
    .post("/api/toggle_wishlist_product", { product_id: productId })
    .then(unwrap);
