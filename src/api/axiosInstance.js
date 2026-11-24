import axios from "axios";

export const TOKEN_KEY = "assalpay_user_token";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors — enrich error message & handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    error.message = getApiErrorMessage(error);
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/** Unwrap the data payload from an API response */
export function unwrap(res) {
  const data = res?.data;
  if (data && typeof data === "object" && "success" in data && !data.success) {
    throw new Error(data.message || "Request failed");
  }
  return data?.body !== undefined ? data.body : (data?.data !== undefined ? data.data : data);
}

/** Extract a human-readable error message from an Axios error */
export function getApiErrorMessage(err) {
  if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
    return "Connexion au serveur impossible. Vérifiez que le serveur backend est démarré.";
  }
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Une erreur inattendue s'est produite"
  );
}

export default axiosInstance;
