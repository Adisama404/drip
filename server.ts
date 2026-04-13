import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "db.json");

// Initial Data Structure
const getInitialData = () => ({
  expenses: [
    { id: '1', amount: 1200, category: 'FOOD', note: 'Dinner', date: new Date(Date.now() - 86400000 * 1).toISOString() },
    { id: '2', amount: 450, category: 'TRAVEL', note: 'Uber', date: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: '3', amount: 3200, category: 'SHOPPING', note: 'Shoes', date: new Date(Date.now() - 86400000 * 3).toISOString() },
  ],
  settings: {
    income: 50000,
    budget: 20000,
    savingsGoal: 15000,
    generalSavings: 0,
    currency: '₹ INR',
    notifications: {
      budget: true,
      daily: false
    }
  },
  wishlist: []
});

// Helper to read/write data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
};

const writeData = (data: any) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // 1. Central Financial State API
  app.get("/api/finance", (req, res) => {
    const data = readData();
    const spent = data.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const wishlistAllocated = data.wishlist.reduce((sum: number, item: any) => sum + item.savedAmount, 0);
    const saved = (data.settings.generalSavings || 0) + wishlistAllocated;
    const free = data.settings.income - spent - saved;

    res.json({
      income: data.settings.income,
      spent,
      saved,
      free,
      savingsBreakdown: {
        general: data.settings.generalSavings || 0,
        wishlist: wishlistAllocated
      },
      // Also return raw data for frontend state sync
      raw: {
        expenses: data.expenses,
        settings: data.settings,
        wishlist: data.wishlist
      }
    });
  });

  // 2. Expense System
  app.post("/api/expense", (req, res) => {
    const data = readData();
    const newExpense = { ...req.body, id: crypto.randomUUID() };
    data.expenses.unshift(newExpense);
    writeData(data);
    res.json(newExpense);
  });

  app.patch("/api/expense/:id", (req, res) => {
    const data = readData();
    const index = data.expenses.findIndex((e: any) => e.id === req.params.id);
    if (index !== -1) {
      data.expenses[index] = { ...data.expenses[index], ...req.body };
      writeData(data);
      res.json(data.expenses[index]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/expense/:id", (req, res) => {
    const data = readData();
    data.expenses = data.expenses.filter((e: any) => e.id !== req.params.id);
    writeData(data);
    res.json({ success: true });
  });

  // 3. Savings System
  app.post("/api/savings/add", (req, res) => {
    const data = readData();
    const { amount } = req.body;
    
    // Validation: Cannot exceed free money
    const spent = data.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const wishlistAllocated = data.wishlist.reduce((sum: number, item: any) => sum + item.savedAmount, 0);
    const saved = (data.settings.generalSavings || 0) + wishlistAllocated;
    const free = data.settings.income - spent - saved;

    if (amount > free) {
      return res.status(400).json({ error: "Insufficient free capital" });
    }

    data.settings.generalSavings = (data.settings.generalSavings || 0) + amount;
    writeData(data);
    res.json(data.settings);
  });

  // 4. Wishlist System
  app.post("/api/wishlist", (req, res) => {
    const data = readData();
    const newItem = { ...req.body, id: crypto.randomUUID(), savedAmount: 0, createdAt: new Date().toISOString() };
    data.wishlist.unshift(newItem);
    writeData(data);
    res.json(newItem);
  });

  app.post("/api/wishlist/allocate", (req, res) => {
    const data = readData();
    const { id, amount } = req.body;
    
    const spent = data.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const wishlistAllocated = data.wishlist.reduce((sum: number, item: any) => sum + item.savedAmount, 0);
    const saved = (data.settings.generalSavings || 0) + wishlistAllocated;
    const free = data.settings.income - spent - saved;

    if (amount > free) {
      return res.status(400).json({ error: "Insufficient free capital" });
    }

    const item = data.wishlist.find((i: any) => i.id === id);
    if (item) {
      item.savedAmount += amount;
      writeData(data);
      res.json(item);
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  });

  app.delete("/api/wishlist/:id", (req, res) => {
    const data = readData();
    data.wishlist = data.wishlist.filter((i: any) => i.id !== req.params.id);
    writeData(data);
    res.json({ success: true });
  });

  // 5. Purchase Logic (CRITICAL)
  app.post("/api/wishlist/purchase", (req, res) => {
    const data = readData();
    const { id } = req.body;
    const itemIndex = data.wishlist.findIndex((i: any) => i.id === id);
    
    if (itemIndex === -1) return res.status(404).json({ error: "Item not found" });
    
    const item = data.wishlist[itemIndex];
    const targetAmount = item.targetAmount;
    const savedAmount = item.savedAmount;

    // 1. Add full amount to expenses
    const newExpense = {
      id: crypto.randomUUID(),
      amount: targetAmount,
      category: 'SHOPPING',
      note: `Purchase: ${item.name}`,
      date: new Date().toISOString()
    };
    data.expenses.unshift(newExpense);

    // 2. Remove wishlist item (this handles subtracting saved portion from savings)
    data.wishlist.splice(itemIndex, 1);

    // Note: Free money is naturally reduced by (targetAmount - savedAmount) 
    // because Spent increases by targetAmount and Saved decreases by savedAmount.
    // Formula: Free = Income - Spent - Saved
    // New Free = Income - (Spent + targetAmount) - (Saved - savedAmount)
    // New Free = Income - Spent - Saved - targetAmount + savedAmount
    // New Free = Old Free - (targetAmount - savedAmount)

    writeData(data);
    res.json({ success: true, expense: newExpense });
  });

  app.patch("/api/settings", (req, res) => {
    const data = readData();
    data.settings = { ...data.settings, ...req.body };
    writeData(data);
    res.json(data.settings);
  });

  app.post("/api/reset", (req, res) => {
    const initial = getInitialData();
    writeData(initial);
    res.json({ success: true });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
