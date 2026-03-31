import { useState, useEffect } from "react";
import { useTrades } from "../context/TradeContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";

interface AddTradeModalProps {
  open: boolean;
  onClose: () => void;
}

const availableTags = ["overtrading", "FOMO", "revenge trading", "poor entry", "early exit"];

export const AddTradeModal = ({ open, onClose }: AddTradeModalProps) => {
  const { addTrade } = useTrades();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    symbol: "",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    tradeType: "buy" as "buy" | "sell",
    notes: "",
    tags: [] as string[],
  });
  const [calculatedPnL, setCalculatedPnL] = useState(0);

  useEffect(() => {
    if (formData.entryPrice && formData.exitPrice && formData.quantity) {
      const entry = parseFloat(formData.entryPrice);
      const exit = parseFloat(formData.exitPrice);
      const qty = parseFloat(formData.quantity);

      if (!isNaN(entry) && !isNaN(exit) && !isNaN(qty)) {
        const pnl =
          formData.tradeType === "buy"
            ? (exit - entry) * qty
            : (entry - exit) * qty;
        setCalculatedPnL(pnl);
      }
    }
  }, [formData.entryPrice, formData.exitPrice, formData.quantity, formData.tradeType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addTrade({
      date: formData.date,
      symbol: formData.symbol.toUpperCase(),
      entryPrice: parseFloat(formData.entryPrice),
      exitPrice: parseFloat(formData.exitPrice),
      quantity: parseFloat(formData.quantity),
      tradeType: formData.tradeType,
      notes: formData.notes,
      tags: formData.tags,
    });

    // Reset form
    setFormData({
      date: new Date().toISOString().split("T")[0],
      symbol: "",
      entryPrice: "",
      exitPrice: "",
      quantity: "",
      tradeType: "buy",
      notes: "",
      tags: [],
    });
    setCalculatedPnL(0);
    onClose();
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl border"
        style={{
          background: "rgba(10, 10, 10, 0.95)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Add New Trade</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-white/90">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-white/90">
                Symbol
              </Label>
              <Input
                id="symbol"
                type="text"
                placeholder="AAPL"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/90">Trade Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.tradeType === "buy" ? "default" : "outline"}
                className={
                  formData.tradeType === "buy"
                    ? "flex-1 bg-[#00D4FF] hover:bg-[#00D4FF]/90"
                    : "flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                }
                onClick={() => setFormData({ ...formData, tradeType: "buy" })}
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={formData.tradeType === "sell" ? "default" : "outline"}
                className={
                  formData.tradeType === "sell"
                    ? "flex-1 bg-[#7A5CFF] hover:bg-[#7A5CFF]/90"
                    : "flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                }
                onClick={() => setFormData({ ...formData, tradeType: "sell" })}
              >
                Sell
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryPrice" className="text-white/90">
                Entry Price
              </Label>
              <Input
                id="entryPrice"
                type="number"
                step="0.01"
                placeholder="150.00"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitPrice" className="text-white/90">
                Exit Price
              </Label>
              <Input
                id="exitPrice"
                type="number"
                step="0.01"
                placeholder="155.00"
                value={formData.exitPrice}
                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-white/90">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                placeholder="10"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                required
              />
            </div>
          </div>

          {/* Calculated PnL Display */}
          {formData.entryPrice && formData.exitPrice && formData.quantity && (
            <div
              className="p-4 rounded-lg border"
              style={{
                background:
                  calculatedPnL >= 0
                    ? "rgba(0, 255, 133, 0.1)"
                    : "rgba(255, 77, 77, 0.1)",
                borderColor:
                  calculatedPnL >= 0
                    ? "rgba(0, 255, 133, 0.3)"
                    : "rgba(255, 77, 77, 0.3)",
              }}
            >
              <p className="text-sm text-white/60 mb-1">Calculated PnL</p>
              <p
                className="text-2xl font-mono"
                style={{ color: calculatedPnL >= 0 ? "#00FF85" : "#FF4D4D" }}
              >
                ${calculatedPnL >= 0 ? "+" : ""}
                {calculatedPnL.toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white/90">Tags (Mistakes/Notes)</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={formData.tags.includes(tag) ? "default" : "outline"}
                  className={
                    formData.tags.includes(tag)
                      ? "bg-[#FF4D4D] hover:bg-[#FF4D4D]/90 cursor-pointer"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer"
                  }
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {formData.tags.includes(tag) && <X className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white/90">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Trade notes, strategy, reasons..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#00D4FF] to-[#7A5CFF] hover:opacity-90"
            >
              Add Trade
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
