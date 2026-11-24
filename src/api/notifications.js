import axiosInstance, { unwrap } from "./axiosInstance";

export const getNotificationList = (params) =>
  axiosInstance.get("/api/notification_list", { params }).then(unwrap);

export const toggleNotificationStatus = (id) =>
  axiosInstance.put("/api/toggle_notification_status", { notification_id: id }).then(unwrap);

export const deleteNotification = (id) =>
  axiosInstance.delete("/api/delete_notification", { data: { notification_id: id } }).then(unwrap);
