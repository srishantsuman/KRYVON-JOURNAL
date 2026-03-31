import { useTrades } from "../context/TradeContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

interface DayDetailModalProps {
  date: string;
  open: boolean;
  onClose: () => void;
}

export const DayDetailModal = ({ date, open, onClose }: DayDetailModalProps) => {
  const { getTradesByDate, getDailyPnL } = useTrades();
  const trades = getTradesByDate(date);
  const dailyPnL = getDailyPnL(date);

  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl < 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

  // Collect all tags from trades
  const allTags = trades.flatMap((t) => t.tags);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl border max-h-[80vh]"
        style={{
          background: "rgba(10, 10, 10, 0.95)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="p-4 rounded-lg border"
              style={{
                background:
                  dailyPnL >= 0
                    ? "rgba(0, 255, 133, 0.1)"
                    : "rgba(255, 77, 77, 0.1)",
                borderColor:
                  dailyPnL >= 0
                    ? "rgba(0, 255, 133, 0.3)"
                    : "rgba(255, 77, 77, 0.3)",
              }}
            >
              <div className="text-sm text-white/60 mb-1">Daily PnL</div>
              <div
                className="text-xl font-mono"
                style={{ color: dailyPnL >= 0 ? "#00FF85" : "#FF4D4D" }}
              >
                ${dailyPnL >= 0 ? "+" : ""}
                {dailyPnL.toFixed(2)}
              </div>
            </div>

            <div
              className="p-4 rounded-lg border"
              style={{
                background: "rgba(0, 212, 255, 0.1)",
                borderColor: "rgba(0, 212, 255, 0.3)",
              }}
            >
              <div className="text-sm text-white/60 mb-1">Win Rate</div>
              <div className="text-xl text-[#00D4FF]">{winRate.toFixed(0)}%</div>
            </div>

            <div
              className="p-4 rounded-lg border"
              style={{
                background: "rgba(122, 92, 255, 0.1)",
                borderColor: "rgba(122, 92, 255, 0.3)",
              }}
            >
              <div className="text-sm text-white/60 mb-1">Total Trades</div>
              <div className="text-xl text-[#7A5CFF]">{trades.length}</div>
            </div>
          </div>

          {/* Mistakes/Tags */}
          {Object.keys(tagCounts).length > 0 && (
            <div
              className="p-4 rounded-lg border"
              style={{
                background: "rgba(255, 77, 77, 0.1)",
                borderColor: "rgba(255, 77, 77, 0.3)",
              }}
            >
              <div className="text-sm text-white/60 mb-2">Behavioral Tags</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(tagCounts).map(([tag, count]) => (
                  <Badge
                    key={tag}
                    className="bg-[#FF4D4D]/20 text-[#FF4D4D] border-[#FF4D4D]/30"
                  >
                    {tag} ({count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Trades List */}
          <div>
            <h3 className="text-lg text-white mb-3">Trades</h3>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="p-4 rounded-lg border"
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      borderColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-lg text-white font-mono">{trade.symbol}</span>
                        <Badge
                          className={
                            trade.tradeType === "buy"
                              ? "ml-2 bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/30"
                              : "ml-2 bg-[#7A5CFF]/20 text-[#7A5CFF] border-[#7A5CFF]/30"
                          }
                        >
                          {trade.tradeType.toUpperCase()}
                        </Badge>
                      </div>
                      <div
                        className="text-lg font-mono"
                        style={{ color: trade.pnl >= 0 ? "#00FF85" : "#FF4D4D" }}
                      >
                        ${trade.pnl >= 0 ? "+" : ""}
                        {trade.pnl.toFixed(2)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                      <div>
                        <span className="text-white/60">Entry: </span>
                        <span className="text-white">${trade.entryPrice}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Exit: </span>
                        <span className="text-white">${trade.exitPrice}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Qty: </span>
                        <span className="text-white">{trade.quantity}</span>
                      </div>
                    </div>

                    {trade.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {trade.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="bg-[#FF4D4D]/10 text-[#FF4D4D] border-[#FF4D4D]/30 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {trade.notes && (
                      <div className="text-sm text-white/70 mt-2">{trade.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
