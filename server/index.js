import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "kryvon_journal_secret_change_in_production";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

app.use(cors({ origin: "*" }));
app.use(express.json());

// Serve built frontend
app.use(express.static(path.join(__dirname, "../dist")));

// ─── In-Memory Store ──────────────────────────────────────────────────────────
const users = new Map();   // email → { id, email, passwordHash }
const trades = new Map();  // userId → Trade[]

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  if (users.has(email))
    return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), email, passwordHash };
  users.set(email, user);
  trades.set(user.id, getSampleTrades());

  const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email } });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email } });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});

// ─── Trades Routes ────────────────────────────────────────────────────────────
app.get("/api/trades", auth, (req, res) => {
  const userTrades = trades.get(req.user.id) || [];
  res.json(userTrades);
});

app.post("/api/trades", auth, (req, res) => {
  const { date, symbol, entryPrice, exitPrice, quantity, tradeType, notes, tags } = req.body;

  // Calculate PnL server-side
  const pnl = tradeType === "buy"
    ? (exitPrice - entryPrice) * quantity
    : (entryPrice - exitPrice) * quantity;

  const trade = {
    id: uuidv4(),
    date,
    symbol: symbol.toUpperCase(),
    entryPrice: Number(entryPrice),
    exitPrice: Number(exitPrice),
    quantity: Number(quantity),
    tradeType,
    pnl: Number(pnl.toFixed(2)),
    notes: notes || "",
    tags: tags || [],
    createdAt: new Date().toISOString(),
  };

  const userTrades = trades.get(req.user.id) || [];
  userTrades.unshift(trade);
  trades.set(req.user.id, userTrades);
  res.json(trade);
});

app.delete("/api/trades/:id", auth, (req, res) => {
  const userTrades = trades.get(req.user.id) || [];
  const filtered = userTrades.filter((t) => t.id !== req.params.id);
  if (filtered.length === userTrades.length)
    return res.status(404).json({ error: "Trade not found" });
  trades.set(req.user.id, filtered);
  res.json({ success: true });
});

// ─── Stats Route ──────────────────────────────────────────────────────────────
app.get("/api/stats", auth, (req, res) => {
  const userTrades = trades.get(req.user.id) || [];
  const totalPnL = userTrades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = userTrades.filter((t) => t.pnl > 0);
  const losses = userTrades.filter((t) => t.pnl < 0);
  const winRate = userTrades.length ? (wins.length / userTrades.length) * 100 : 0;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;

  res.json({
    totalTrades: userTrades.length,
    totalPnL: Number(totalPnL.toFixed(2)),
    winRate: Number(winRate.toFixed(1)),
    avgRiskReward: Number(riskReward.toFixed(2)),
    wins: wins.length,
    losses: losses.length,
  });
});

// ─── AI Chat Route ────────────────────────────────────────────────────────────
app.post("/api/chat", auth, async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const userTrades = trades.get(req.user.id) || [];
  const totalPnL = userTrades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = userTrades.filter((t) => t.pnl > 0);
  const winRate = userTrades.length ? ((wins.length / userTrades.length) * 100).toFixed(1) : 0;

  const systemPrompt = `You are KRYVON AI, an expert trading journal assistant. Help traders improve their performance through data-driven analysis.

User's trading stats:
- Total trades: ${userTrades.length}
- Total P&L: $${totalPnL.toFixed(2)}
- Win rate: ${winRate}%
- Recent trades: ${JSON.stringify(userTrades.slice(0, 8))}

Be concise, specific, and actionable. Reference their actual trade data when relevant. Help them identify patterns, mistakes, and opportunities.`;

  try {
    if (!ANTHROPIC_API_KEY) {
      return res.json({
        reply: `I'm KRYVON AI! To enable real AI responses, add your ANTHROPIC_API_KEY to the server .env file. Your current stats: ${userTrades.length} trades, $${totalPnL.toFixed(2)} P&L, ${winRate}% win rate.`,
      });
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ error: "AI unavailable", detail: err.message });
  }
});

// ─── Catch-all → SPA ─────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// ─── Sample Data ──────────────────────────────────────────────────────────────
function getSampleTrades() {
  const now = new Date();
  const day = (d) => new Date(now - d * 86400000).toISOString().split("T")[0];
  return [
    { id: uuidv4(), date: day(3), symbol: "AAPL", entryPrice: 150, exitPrice: 155, quantity: 10, tradeType: "buy", pnl: 50, notes: "Strong breakout above resistance", tags: [], createdAt: new Date(now - 3 * 86400000).toISOString() },
    { id: uuidv4(), date: day(3), symbol: "TSLA", entryPrice: 180, exitPrice: 175, quantity: 5, tradeType: "buy", pnl: -25, notes: "Failed to hold support", tags: ["overtrading"], createdAt: new Date(now - 3 * 86400000 + 3600000).toISOString() },
    { id: uuidv4(), date: day(4), symbol: "MSFT", entryPrice: 380, exitPrice: 385, quantity: 8, tradeType: "buy", pnl: 40, notes: "Gap up continuation", tags: [], createdAt: new Date(now - 4 * 86400000).toISOString() },
    { id: uuidv4(), date: day(5), symbol: "NVDA", entryPrice: 500, exitPrice: 490, quantity: 3, tradeType: "buy", pnl: -30, notes: "Stopped out", tags: ["FOMO"], createdAt: new Date(now - 5 * 86400000).toISOString() },
    { id: uuidv4(), date: day(6), symbol: "AMD", entryPrice: 120, exitPrice: 125, quantity: 15, tradeType: "buy", pnl: 75, notes: "Perfect entry at support", tags: [], createdAt: new Date(now - 6 * 86400000).toISOString() },
    { id: uuidv4(), date: day(10), symbol: "GOOGL", entryPrice: 140, exitPrice: 138, quantity: 7, tradeType: "buy", pnl: -14, notes: "Revenge trade - should have waited", tags: ["revenge trading"], createdAt: new Date(now - 10 * 86400000).toISOString() },
    { id: uuidv4(), date: day(11), symbol: "META", entryPrice: 480, exitPrice: 490, quantity: 5, tradeType: "buy", pnl: 50, notes: "Nice momentum play", tags: [], createdAt: new Date(now - 11 * 86400000).toISOString() },
    { id: uuidv4(), date: day(12), symbol: "AMZN", entryPrice: 175, exitPrice: 180, quantity: 10, tradeType: "buy", pnl: 50, notes: "Bounce off 50 EMA", tags: [], createdAt: new Date(now - 12 * 86400000).toISOString() },
  ];
}

app.listen(PORT, () => {
  console.log(`\n🚀 KRYVON Journal server → http://localhost:${PORT}`);
  console.log(ANTHROPIC_API_KEY ? `🤖 AI chat enabled` : `⚠️  Add ANTHROPIC_API_KEY to .env for AI chat`);
});
