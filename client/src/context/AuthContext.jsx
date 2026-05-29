import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService.js";

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the app and provides authentication state + actions.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing session
  useEffect(() => {
    const cachedToken = localStorage.getItem("fitsync_token");
    if (cachedToken) {
      setToken(cachedToken);
      verifySession(cachedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function verifySession(authToken) {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      setToken(authToken);
    } catch (err) {
      console.error("Session validation failed:", err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  }

  function handleLoginSuccess(loggedInUser, sessionToken) {
    localStorage.setItem("fitsync_token", sessionToken);
    setToken(sessionToken);
    setUser(loggedInUser);
  }

  function handleLogout() {
    localStorage.removeItem("fitsync_token");
    setToken(null);
    setUser(null);
  }

  function updateUser(updatedUser) {
    setUser(updatedUser);
  }

  const value = {
    user,
    token,
    loading,
    handleLoginSuccess,
    handleLogout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context in any component.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
