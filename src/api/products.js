import axiosInstance, { unwrap } from "./axiosInstance";

export const getUserProductList = (params) =>
  axiosInstance.get("/api/user_side_product_list", { params }).then(unwrap);

export const getUserProductDetails = (productId) =>
  axiosInstance
    .get("/api/user_side_product_details", { params: { product_id: productId } })
    .then(unwrap);

export const getFeaturedList = (params) =>
  axiosInstance.get("/api/featured_list", { params }).then(unwrap);

export const getSizeCharts = () =>
  axiosInstance.get("/api/size_chart_list").then(unwrap);

export const getCategoryList = (params) =>
  axiosInstance.get("/api/category_list", { params }).then(unwrap);

export const getSubCategoryList = (params) =>
  axiosInstance.get("/api/sub_category_list", { params }).then(unwrap);
