import { useTrades } from "../context/TradeContext";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const Dashboard = () => {
  const { trades, getTotalPnL, getWinRate, getTotalTrades, getAvgRiskReward } = useTrades();

  const totalPnL = getTotalPnL();
  const winRate = getWinRate();
  const totalTrades = getTotalTrades();
  const avgRR = getAvgRiskReward();

  // Prepare chart data
  const dailyPnLData = trades.reduce((acc, trade) => {
    const existing = acc.find((item) => item.date === trade.date);
    if (existing) {
      existing.pnl += trade.pnl;
      existing.trades += 1;
    } else {
      acc.push({ date: trade.date, pnl: trade.pnl, trades: 1 });
    }
    return acc;
  }, [] as { date: string; pnl: number; trades: number }[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Cumulative PnL for line chart
  let cumulative = 0;
  const cumulativePnLData = dailyPnLData.map((item) => {
    cumulative += item.pnl;
    return { date: item.date, pnl: cumulative };
  });

  // Win/Loss pie chart
  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl < 0).length;
  const winLossData = [
    { name: "Wins", value: wins, color: "#00FF85" },
    { name: "Losses", value: losses, color: "#FF4D4D" },
  ];

  const stats = [
    {
      label: "Total PnL",
      value: `$${totalPnL.toFixed(2)}`,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown,
      color: totalPnL >= 0 ? "#00FF85" : "#FF4D4D",
      bgGradient: totalPnL >= 0
        ? "linear-gradient(135deg, rgba(0, 255, 133, 0.1) 0%, rgba(0, 255, 133, 0.05) 100%)"
        : "linear-gradient(135deg, rgba(255, 77, 77, 0.1) 0%, rgba(255, 77, 77, 0.05) 100%)",
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: "#00D4FF",
      bgGradient: "linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)",
    },
    {
      label: "Total Trades",
      value: totalTrades.toString(),
      icon: Activity,
      color: "#7A5CFF",
      bgGradient: "linear-gradient(135deg, rgba(122, 92, 255, 0.1) 0%, rgba(122, 92, 255, 0.05) 100%)",
    },
    {
      label: "Avg Risk/Reward",
      value: avgRR > 0 ? avgRR.toFixed(2) : "N/A",
      icon: TrendingUp,
      color: "#00D4FF",
      bgGradient: "linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white mb-1">Dashboard</h1>
        <p className="text-white/60">Track your trading performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl p-6 border backdrop-blur-sm"
            style={{
              background: stat.bgGradient,
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}20` }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-white/60 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - PnL Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl p-6 border backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="text-xl text-white mb-4">PnL Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativePnLData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255, 255, 255, 0.4)"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="#00D4FF"
                strokeWidth={2}
                dot={{ fill: "#00D4FF", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart - Win vs Loss */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl p-6 border backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="text-xl text-white mb-4">Win vs Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {winLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bar Chart - Daily PnL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl p-6 border backdrop-blur-sm"
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <h3 className="text-xl text-white mb-4">Daily PnL</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyPnLData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255, 255, 255, 0.4)"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "rgba(0, 0, 0, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {dailyPnLData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#00FF85" : "#FF4D4D"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};
