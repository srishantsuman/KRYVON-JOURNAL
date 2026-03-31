import { useTrades } from "../context/TradeContext";
import { motion } from "motion/react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const Analytics = () => {
  const { trades } = useTrades();

  // Tag-based analysis
  const tagAnalysis = trades.reduce((acc, trade) => {
    trade.tags.forEach((tag) => {
      if (!acc[tag]) {
        acc[tag] = { count: 0, totalPnL: 0, trades: [] };
      }
      acc[tag].count += 1;
      acc[tag].totalPnL += trade.pnl;
      acc[tag].trades.push(trade);
    });
    return acc;
  }, {} as Record<string, { count: number; totalPnL: number; trades: any[] }>);

  const tagData = Object.entries(tagAnalysis).map(([tag, data]) => ({
    tag,
    count: data.count,
    avgPnL: data.totalPnL / data.count,
    totalPnL: data.totalPnL,
  }));

  // Symbol performance
  const symbolPerformance = trades.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = { count: 0, totalPnL: 0, wins: 0 };
    }
    acc[trade.symbol].count += 1;
    acc[trade.symbol].totalPnL += trade.pnl;
    if (trade.pnl > 0) acc[trade.symbol].wins += 1;
    return acc;
  }, {} as Record<string, { count: number; totalPnL: number; wins: number }>);

  const symbolData = Object.entries(symbolPerformance)
    .map(([symbol, data]) => ({
      symbol,
      totalPnL: data.totalPnL,
      winRate: (data.wins / data.count) * 100,
      trades: data.count,
    }))
    .sort((a, b) => b.totalPnL - a.totalPnL)
    .slice(0, 10);

  // PnL Distribution
  const pnlRanges = [
    { range: "< -$50", min: -Infinity, max: -50, count: 0, color: "#FF4D4D" },
    { range: "-$50 to -$20", min: -50, max: -20, count: 0, color: "#FF6B6B" },
    { range: "-$20 to $0", min: -20, max: 0, count: 0, color: "#FF8989" },
    { range: "$0 to $20", min: 0, max: 20, count: 0, color: "#85FFB8" },
    { range: "$20 to $50", min: 20, max: 50, count: 0, color: "#5CFFAA" },
    { range: "> $50", min: 50, max: Infinity, count: 0, color: "#00FF85" },
  ];

  trades.forEach((trade) => {
    const range = pnlRanges.find((r) => trade.pnl >= r.min && trade.pnl < r.max);
    if (range) range.count += 1;
  });

  // Time of day analysis (using createdAt)
  const hourlyPerformance = trades.reduce((acc, trade) => {
    const hour = new Date(trade.createdAt).getHours();
    if (!acc[hour]) {
      acc[hour] = { totalPnL: 0, count: 0 };
    }
    acc[hour].totalPnL += trade.pnl;
    acc[hour].count += 1;
    return acc;
  }, {} as Record<number, { totalPnL: number; count: number }>);

  const hourlyData = Object.entries(hourlyPerformance)
    .map(([hour, data]) => ({
      hour: `${hour}:00`,
      avgPnL: data.totalPnL / data.count,
      trades: data.count,
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-white mb-1">Analytics</h1>
        <p className="text-white/60">Deep dive into your trading patterns</p>
      </div>

      {/* Mistake Analysis */}
      {tagData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-6 border backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="text-xl text-white mb-4">Behavioral Tag Analysis</h3>
          <p className="text-white/60 text-sm mb-4">
            Impact of mistakes and behavioral patterns on your PnL
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tagData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="tag" stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="totalPnL" fill="#FF4D4D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symbol Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-6 border backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="text-xl text-white mb-4">Top Symbols by PnL</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={symbolData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis type="number" stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="symbol"
                stroke="rgba(255, 255, 255, 0.4)"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="totalPnL" radius={[0, 4, 4, 0]}>
                {symbolData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.totalPnL >= 0 ? "#00FF85" : "#FF4D4D"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* PnL Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-6 border backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="text-xl text-white mb-4">PnL Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pnlRanges.filter((r) => r.count > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="count"
              >
                {pnlRanges
                  .filter((r) => r.count > 0)
                  .map((entry, index) => (
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

      {/* Hourly Performance */}
      {hourlyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl p-6 border backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <h3 className="text-xl text-white mb-4">Performance by Time of Day</h3>
          <p className="text-white/60 text-sm mb-4">
            Identify your best and worst trading hours
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="hour" stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255, 255, 255, 0.4)" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="avgPnL" radius={[4, 4, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.avgPnL >= 0 ? "#00FF85" : "#FF4D4D"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl p-6 border backdrop-blur-sm"
        style={{
          background: "rgba(0, 212, 255, 0.05)",
          borderColor: "rgba(0, 212, 255, 0.2)",
        }}
      >
        <h3 className="text-xl text-white mb-4">Key Insights</h3>
        <div className="space-y-3">
          {tagData.length > 0 && (
            <div className="text-white/80">
              <span className="text-[#00D4FF]">•</span> Your most common mistake is{" "}
              <span className="text-[#FF4D4D]">
                {tagData.sort((a, b) => b.count - a.count)[0].tag}
              </span>{" "}
              with {tagData.sort((a, b) => b.count - a.count)[0].count} occurrences
            </div>
          )}
          {symbolData.length > 0 && (
            <div className="text-white/80">
              <span className="text-[#00D4FF]">•</span> Your best performing symbol is{" "}
              <span className="text-[#00FF85]">{symbolData[0].symbol}</span> with a total PnL of $
              {symbolData[0].totalPnL.toFixed(2)}
            </div>
          )}
          {trades.length > 0 && (
            <div className="text-white/80">
              <span className="text-[#00D4FF]">•</span> You've completed{" "}
              <span className="text-white">{trades.length}</span> trades with an average PnL of $
              {(trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length).toFixed(2)} per trade
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
