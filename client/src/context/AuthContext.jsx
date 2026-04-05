import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, setAccessToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("sf_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [isAuthReady, setIsAuthReady] = useState(false);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("sf_user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("sf_user");
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("sf_access_token");
      if (!token) {
        persistUser(null);
        setIsAuthReady(true);
        return;
      }

      setAccessToken(token);
      try {
        const { data } = await authApi.me();
        persistUser(data.user);
      } catch {
        setAccessToken("");
        persistUser(null);
      } finally {
        setIsAuthReady(true);
      }
    };

    bootstrap();
  }, []);

  const login = async (payload) => {
    const { data } = await authApi.login(payload);
    setAccessToken(data.accessToken);
    persistUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken("");
      persistUser(null);
    }
  };

  const refreshMe = async () => {
    const { data } = await authApi.me();
    persistUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({ user, setUser: persistUser, isAuthReady, isAuthenticated: !!user, login, logout, refreshMe }),
    [user, isAuthReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
};
