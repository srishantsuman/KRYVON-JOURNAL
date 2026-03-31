import React, { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API = "";

async function apiCall(path: string, body: object) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("kryvon_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string) => {
    const data = await apiCall("/api/login", { email, password });
    setUser(data.user);
    localStorage.setItem("kryvon_user", JSON.stringify(data.user));
    localStorage.setItem("kryvon_token", data.token);
  };

  const register = async (email: string, password: string) => {
    const data = await apiCall("/api/register", { email, password });
    setUser(data.user);
    localStorage.setItem("kryvon_user", JSON.stringify(data.user));
    localStorage.setItem("kryvon_token", data.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("kryvon_user");
    localStorage.removeItem("kryvon_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
