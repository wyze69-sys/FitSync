import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService.js";
import { tokenStore } from "../services/apiClient.js";

const AuthContext = createContext(null);

/**
 * AuthProvider holds the authenticated user/session and exposes auth actions.
 * Token persistence is delegated to the central apiClient token store, so no
 * component touches localStorage directly.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!tokenStore.get()) {
        setLoading(false);
        return;
      }
      try {
        const userData = await authService.getMe();
        if (active) setUser(userData);
      } catch (err) {
        tokenStore.clear();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedInUser, token } = await authService.login(email, password);
    tokenStore.set(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const { user: newUser, token } = await authService.register(email, password, name);
    tokenStore.set(token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = { user, loading, login, register, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
