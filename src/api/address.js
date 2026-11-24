import axiosInstance, { unwrap } from "./axiosInstance";

export const getAddressList = () =>
  axiosInstance.get("/api/address_list").then(unwrap);

export const addAddress = (data) =>
  axiosInstance.post("/api/add_address", data).then(unwrap);

export const editAddress = (data) =>
  axiosInstance.put("/api/edit_address", data).then(unwrap);

export const setDefaultAddress = (id) =>
  axiosInstance.put("/api/set_default_address", { address_id: id }).then(unwrap);

export const deleteAddress = (id) =>
  axiosInstance.delete("/api/delete_address", { data: { address_id: id } }).then(unwrap);
