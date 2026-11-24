import axiosInstance, { unwrap } from "./axiosInstance";

export const getSearchSuggestions = (q) =>
  axiosInstance.get("/api/search_suggestions", { params: { q } }).then(unwrap);

export const getSearchHistory = () =>
  axiosInstance.get("/api/get_search_history").then(unwrap);

export const deleteSearchHistory = () =>
  axiosInstance.delete("/api/delete_search_history").then(unwrap);

export const getTrendingSearchCategory = () =>
  axiosInstance.get("/api/trending_search_category").then(unwrap);
