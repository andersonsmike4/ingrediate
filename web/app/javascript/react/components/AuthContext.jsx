import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { checkAuthStatus, login as apiLogin, signup as apiSignup, logout as apiLogout } from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await checkAuthStatus();
      setUser(data.user);
      setIsAuthenticated(data.authenticated);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const signupUser = async (name, email, password, passwordConfirmation) => {
    const data = await apiSignup(name, email, password, passwordConfirmation);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logoutUser = async () => {
    await apiLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, signup: signupUser, logout: logoutUser, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
