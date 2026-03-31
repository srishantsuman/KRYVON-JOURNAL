import { useState } from "react";
import { useTrades } from "../context/TradeContext";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { DayDetailModal } from "../components/DayDetailModal";

export const CalendarView = () => {
  const { trades, getDailyPnL, getTradesByDate } = useTrades();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getPnLColor = (pnl: number) => {
    if (pnl === 0) return "rgba(255, 255, 255, 0.05)";
    
    const maxPnL = 100; // Normalize intensity
    const intensity = Math.min(Math.abs(pnl) / maxPnL, 1);
    
    if (pnl > 0) {
      return `rgba(0, 255, 133, ${0.2 + intensity * 0.6})`;
    } else {
      return `rgba(255, 77, 77, ${0.2 + intensity * 0.6})`;
    }
  };

  const formatDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getDayStats = (dateString: string) => {
    const dayTrades = getTradesByDate(dateString);
    const pnl = getDailyPnL(dateString);
    const wins = dayTrades.filter((t) => t.pnl > 0).length;
    const losses = dayTrades.filter((t) => t.pnl < 0).length;
    const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;

    return {
      pnl,
      trades: dayTrades.length,
      wins,
      losses,
      winRate,
    };
  };

  // Calculate streaks
  const calculateStreaks = () => {
    const dailyPnLs: { date: string; pnl: number }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateString(day);
      const pnl = getDailyPnL(dateString);
      if (pnl !== 0) {
        dailyPnLs.push({ date: dateString, pnl });
      }
    }

    let currentStreak = 0;
    let streakType: "win" | "loss" | null = null;

    for (let i = dailyPnLs.length - 1; i >= 0; i--) {
      const { pnl } = dailyPnLs[i];
      if (pnl > 0) {
        if (streakType === null || streakType === "win") {
          streakType = "win";
          currentStreak++;
        } else {
          break;
        }
      } else if (pnl < 0) {
        if (streakType === null || streakType === "loss") {
          streakType = "loss";
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return { currentStreak, streakType };
  };

  const { currentStreak, streakType } = calculateStreaks();

  // Weekly summary
  const getWeeklyStats = () => {
    let totalPnL = 0;
    let totalTrades = 0;
    let wins = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateString(day);
      const dayTrades = getTradesByDate(dateString);
      totalTrades += dayTrades.length;
      totalPnL += getDailyPnL(dateString);
      wins += dayTrades.filter((t) => t.pnl > 0).length;
    }

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    return { totalPnL, totalTrades, winRate };
  };

  const weeklyStats = getWeeklyStats();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = formatDateString(day);
    const stats = getDayStats(dateString);
    const isToday =
      new Date().getDate() === day &&
      new Date().getMonth() === month &&
      new Date().getFullYear() === year;

    days.push(
      <motion.div
        key={day}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: day * 0.01 }}
        className="aspect-square p-2 rounded-lg border cursor-pointer relative group"
        style={{
          background: getPnLColor(stats.pnl),
          borderColor: isToday ? "#00D4FF" : "rgba(255, 255, 255, 0.1)",
          borderWidth: isToday ? "2px" : "1px",
        }}
        onClick={() => stats.trades > 0 && setSelectedDate(dateString)}
      >
        <div className="text-sm text-white/90">{day}</div>
        {stats.trades > 0 && (
          <div className="absolute inset-x-2 bottom-2 space-y-1">
            <div
              className="text-xs font-mono"
              style={{ color: stats.pnl >= 0 ? "#00FF85" : "#FF4D4D" }}
            >
              ${stats.pnl >= 0 ? "+" : ""}
              {stats.pnl.toFixed(0)}
            </div>
            <div className="text-xs text-white/60">{stats.trades} trades</div>
          </div>
        )}

        {/* Tooltip */}
        {stats.trades > 0 && (
          <div
            className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 p-3 rounded-lg border backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap"
            style={{
              background: "rgba(0, 0, 0, 0.95)",
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <div className="text-sm text-white mb-1">{new Date(dateString).toLocaleDateString()}</div>
            <div className="text-xs space-y-1">
              <div
                className="font-mono"
                style={{ color: stats.pnl >= 0 ? "#00FF85" : "#FF4D4D" }}
              >
                PnL: ${stats.pnl >= 0 ? "+" : ""}
                {stats.pnl.toFixed(2)}
              </div>
              <div className="text-white/60">Trades: {stats.trades}</div>
              <div className="text-white/60">Win Rate: {stats.winRate.toFixed(0)}%</div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white mb-1">Trading Calendar</h1>
          <p className="text-white/60">Visual performance tracking</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 border"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="text-sm text-white/60 mb-1">Monthly PnL</div>
          <div
            className="text-2xl font-mono"
            style={{ color: weeklyStats.totalPnL >= 0 ? "#00FF85" : "#FF4D4D" }}
          >
            ${weeklyStats.totalPnL >= 0 ? "+" : ""}
            {weeklyStats.totalPnL.toFixed(2)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-4 border"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="text-sm text-white/60 mb-1">Current Streak</div>
          <div className="text-2xl" style={{ color: streakType === "win" ? "#00FF85" : "#FF4D4D" }}>
            {currentStreak} {streakType === "win" ? "🔥" : "❄️"}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-4 border"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="text-sm text-white/60 mb-1">Monthly Win Rate</div>
          <div className="text-2xl text-[#00D4FF]">{weeklyStats.winRate.toFixed(1)}%</div>
        </motion.div>
      </div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl p-6 border"
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={previousMonth}
            className="text-white/70 hover:text-white hover:bg-white/5"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl text-white">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextMonth}
            className="text-white/70 hover:text-white hover:bg-white/5"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm text-white/60 pb-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">{days}</div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ background: "rgba(0, 255, 133, 0.4)" }}
            />
            <span className="text-white/60">Profit</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ background: "rgba(255, 77, 77, 0.4)" }}
            />
            <span className="text-white/60">Loss</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border"
              style={{ borderColor: "#00D4FF" }}
            />
            <span className="text-white/60">Today</span>
          </div>
        </div>
      </motion.div>

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          open={!!selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};
