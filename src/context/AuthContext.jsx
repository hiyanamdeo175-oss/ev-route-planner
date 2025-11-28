import React, { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("ev_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("ev_user");
    const savedToken = localStorage.getItem("ev_token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { user: loggedInUser, token } = await apiLogin(email, password);
      setUser(loggedInUser);
      setToken(token);
      localStorage.setItem("ev_user", JSON.stringify(loggedInUser));
      localStorage.setItem("ev_token", token);

      // Seed profile once on first login if not present (generic defaults)
      if (!localStorage.getItem("userProfile")) {
        const baseProfile = {
          name: loggedInUser.name || "EV Driver",
          email: loggedInUser.email || "user@example.com",
          phone: loggedInUser.phone || "",
          role: loggedInUser.role || "user",
          evModel: "Tata Nexon EV",
          range: "320 km",
          batteryHealth: "95",
          tireHealth: "90",
          odometerKm: "12000",
          preferredChargeLimit: "80",
          avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        };
        localStorage.setItem("userProfile", JSON.stringify(baseProfile));
      }
    } catch (err) {
      throw err; // let caller handle UI error
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("ev_user");
    localStorage.removeItem("ev_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
