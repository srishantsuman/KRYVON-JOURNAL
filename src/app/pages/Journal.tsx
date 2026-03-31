import { useState } from "react";
import { useTrades } from "../context/TradeContext";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import { Plus, Trash2, Edit } from "lucide-react";
import { AddTradeModal } from "../components/AddTradeModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";

export const Journal = () => {
  const { trades, deleteTrade } = useTrades();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white mb-1">Trading Journal</h1>
          <p className="text-white/60">Log and review your trades</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#00D4FF] to-[#7A5CFF] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Trade
        </Button>
      </div>

      {/* Trades Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border backdrop-blur-sm overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/70">Date</TableHead>
                <TableHead className="text-white/70">Symbol</TableHead>
                <TableHead className="text-white/70">Type</TableHead>
                <TableHead className="text-white/70">Entry</TableHead>
                <TableHead className="text-white/70">Exit</TableHead>
                <TableHead className="text-white/70">Quantity</TableHead>
                <TableHead className="text-white/70">PnL</TableHead>
                <TableHead className="text-white/70">Tags</TableHead>
                <TableHead className="text-white/70">Notes</TableHead>
                <TableHead className="text-white/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-white/40 py-12">
                    No trades yet. Add your first trade to get started!
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade, index) => (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="text-white/90">{formatDate(trade.date)}</TableCell>
                    <TableCell className="text-white font-mono">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          trade.tradeType === "buy"
                            ? "bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/30"
                            : "bg-[#7A5CFF]/20 text-[#7A5CFF] border-[#7A5CFF]/30"
                        }
                      >
                        {trade.tradeType.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/90">${trade.entryPrice}</TableCell>
                    <TableCell className="text-white/90">${trade.exitPrice}</TableCell>
                    <TableCell className="text-white/90">{trade.quantity}</TableCell>
                    <TableCell>
                      <span
                        className="font-mono"
                        style={{
                          color: trade.pnl >= 0 ? "#00FF85" : "#FF4D4D",
                        }}
                      >
                        ${trade.pnl >= 0 ? "+" : ""}
                        {trade.pnl.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
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
                    </TableCell>
                    <TableCell className="text-white/70 max-w-xs truncate">
                      {trade.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/40 hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/10"
                        onClick={() => deleteTrade(trade.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {/* Add Trade Modal */}
      <AddTradeModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
