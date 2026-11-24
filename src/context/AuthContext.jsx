import { createContext, useContext, useState, useCallback } from "react";
import { axiosInstance, TOKEN_KEY, unwrap } from "../api/axiosInstance.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/profile_details");
      const data = unwrap(res);
      setUser(data?.user || data);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const isVendor = user?.user_type === "vendor";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshMe, isVendor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
