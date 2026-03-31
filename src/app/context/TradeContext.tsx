import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";

export interface Trade {
  id: string;
  date: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  tradeType: "buy" | "sell";
  pnl: number;
  notes: string;
  tags: string[];
  createdAt: string;
}

interface TradeContextType {
  trades: Trade[];
  loading: boolean;
  addTrade: (trade: Omit<Trade, "id" | "pnl" | "createdAt">) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  getTradesByDate: (date: string) => Trade[];
  getDailyPnL: (date: string) => number;
  getTotalPnL: () => number;
  getWinRate: () => number;
  getTotalTrades: () => number;
  getAvgRiskReward: () => number;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

const API = "";
function getToken() {
  return localStorage.getItem("kryvon_token");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const TradeProvider = ({ children }: { children: ReactNode }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Load trades from backend on mount
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    apiFetch("/api/trades")
      .then(setTrades)
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));
  }, []);

  const addTrade = async (trade: Omit<Trade, "id" | "pnl" | "createdAt">) => {
    try {
      const saved = await apiFetch("/api/trades", {
        method: "POST",
        body: JSON.stringify(trade),
      });
      setTrades((prev) => [saved, ...prev]);
      toast.success("Trade added successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to add trade");
    }
  };

  const deleteTrade = async (id: string) => {
    try {
      await apiFetch(`/api/trades/${id}`, { method: "DELETE" });
      setTrades((prev) => prev.filter((t) => t.id !== id));
      toast.success("Trade deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete trade");
    }
  };

  const getTradesByDate = (date: string) =>
    trades.filter((t) => t.date === date);

  const getDailyPnL = (date: string) =>
    trades.filter((t) => t.date === date).reduce((sum, t) => sum + t.pnl, 0);

  const getTotalPnL = () =>
    trades.reduce((sum, t) => sum + t.pnl, 0);

  const getWinRate = () => {
    if (!trades.length) return 0;
    return (trades.filter((t) => t.pnl > 0).length / trades.length) * 100;
  };

  const getTotalTrades = () => trades.length;

  const getAvgRiskReward = () => {
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl < 0);
    if (!losses.length) return 0;
    const avgWin = wins.reduce((s, t) => s + t.pnl, 0) / (wins.length || 1);
    const avgLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length);
    return avgLoss > 0 ? avgWin / avgLoss : 0;
  };

  return (
    <TradeContext.Provider value={{
      trades, loading, addTrade, deleteTrade,
      getTradesByDate, getDailyPnL, getTotalPnL,
      getWinRate, getTotalTrades, getAvgRiskReward,
    }}>
      {children}
    </TradeContext.Provider>
  );
};

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) throw new Error("useTrades must be used within TradeProvider");
  return context;
};
