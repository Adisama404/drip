import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Expense, AppSettings, WishlistItem } from '../types';
import originalSeed from '../../db.json';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: any;

export async function initDB() {
  try {
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection('drip', false)).result;
    
    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection('drip', false);
    } else {
      db = await sqlite.createConnection('drip', false, 'no-encryption', 1, false);
    }
    
    await db.open();
    
    const schema = `
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        note TEXT,
        date TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        income REAL DEFAULT 50000,
        budget REAL DEFAULT 20000,
        savingsGoal REAL DEFAULT 15000,
        generalSavings REAL DEFAULT 0,
        currency TEXT DEFAULT '₹ INR',
        notificationBudget INTEGER DEFAULT 1,
        notificationDaily INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS wishlist (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        targetAmount REAL NOT NULL,
        savedAmount REAL DEFAULT 0,
        createdAt TEXT NOT NULL
      );
      INSERT OR IGNORE INTO settings (id) VALUES (1);
    `;
    await db.execute(schema);
  } catch (err) {
    console.error('Error in initDB', err);
    throw err;
  }
}

export interface FinanceState {
  income: number;
  spent: number;
  saved: number;
  free: number;
  savingsBreakdown: {
    general: number;
    wishlist: number;
  };
  raw: {
    expenses: Expense[];
    settings: AppSettings;
    wishlist: WishlistItem[];
  };
}

export async function getFinance(): Promise<FinanceState> {
  const expensesRes = await db.query('SELECT * FROM expenses');
  const expenses = expensesRes.values as Expense[] || [];
  
  const settingsRes = await db.query('SELECT * FROM settings WHERE id = 1');
  const rawSet = settingsRes.values?.[0];
  const settings: AppSettings = rawSet ? {
    income: rawSet.income,
    budget: rawSet.budget,
    savingsGoal: rawSet.savingsGoal,
    generalSavings: rawSet.generalSavings,
    currency: rawSet.currency,
    notifications: {
      budget: !!rawSet.notificationBudget,
      daily: !!rawSet.notificationDaily
    }
  } : {
    income: 50000, budget: 20000, savingsGoal: 15000, generalSavings: 0, currency: '₹ INR', notifications: { budget: true, daily: false }
  };
  
  const wishlistRes = await db.query('SELECT * FROM wishlist');
  const wishlist = wishlistRes.values as WishlistItem[] || [];
  
  const spent = expenses.reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
  const wishlistAllocated = wishlist.reduce((acc: number, w: any) => acc + (w.savedAmount || 0), 0);
  const saved = settings.generalSavings + wishlistAllocated;
  const free = settings.income - spent - saved;
  
  return {
    income: settings.income,
    spent,
    saved,
    free,
    savingsBreakdown: {
      general: settings.generalSavings,
      wishlist: wishlistAllocated
    },
    raw: {
      expenses,
      settings,
      wishlist
    }
  };
}

export async function addExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const id = crypto.randomUUID();
  await db.run('INSERT INTO expenses (id, amount, category, note, date) VALUES (?, ?, ?, ?, ?)', [id, data.amount, data.category, data.note, data.date]);
  return { id, ...data };
}

export async function updateExpense(id: string, data: Partial<{amount: number, category: string, note: string, date: string}>): Promise<Expense> {
  const keys = Object.keys(data);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  if (keys.length > 0) {
    await db.run(`UPDATE expenses SET ${sets} WHERE id = ?`, [...values, id]);
  }
  const res = await db.query('SELECT * FROM expenses WHERE id = ?', [id]);
  return res.values?.[0] as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  await db.run('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function addSavings(amount: number): Promise<void> {
  const finance = await getFinance();
  if (amount > finance.free) {
    throw new Error('Not enough free capital');
  }
  await db.run('UPDATE settings SET generalSavings = generalSavings + ? WHERE id = 1', [amount]);
}

export async function addWishlistItem(data: { name: string, targetAmount: number }): Promise<WishlistItem> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.run('INSERT INTO wishlist (id, name, targetAmount, savedAmount, createdAt) VALUES (?, ?, ?, 0, ?)', [id, data.name, data.targetAmount, createdAt]);
  return { id, name: data.name, targetAmount: data.targetAmount, savedAmount: 0, createdAt };
}

export async function allocateToWishlist(id: string, amount: number): Promise<void> {
  const finance = await getFinance();
  if (amount > finance.free) {
    throw new Error('Not enough free capital');
  }
  await db.run('UPDATE wishlist SET savedAmount = savedAmount + ? WHERE id = ?', [amount, id]);
}

export async function deleteWishlistItem(id: string): Promise<void> {
  await db.run('DELETE FROM wishlist WHERE id = ?', [id]);
}

export async function purchaseWishlistItem(id: string): Promise<void> {
  const wRes = await db.query('SELECT * FROM wishlist WHERE id = ?', [id]);
  const item = wRes.values?.[0] as WishlistItem;
  if (!item) throw new Error('Item not found');
  
  const expId = crypto.randomUUID();
  const date = new Date().toISOString();
  const note = `Purchase: ${item.name}`;
  
  await db.execute('BEGIN TRANSACTION');
  try {
    await db.run('INSERT INTO expenses (id, amount, category, note, date) VALUES (?, ?, ?, ?, ?)', [expId, item.targetAmount, 'SHOPPING', note, date]);
    await db.run('DELETE FROM wishlist WHERE id = ?', [id]);
    await db.execute('COMMIT');
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  const fields = [];
  const vals: any[] = [];
  if ('income' in settings) { fields.push('income = ?'); vals.push(settings.income); }
  if ('budget' in settings) { fields.push('budget = ?'); vals.push(settings.budget); }
  if ('savingsGoal' in settings) { fields.push('savingsGoal = ?'); vals.push(settings.savingsGoal); }
  if ('generalSavings' in settings) { fields.push('generalSavings = ?'); vals.push(settings.generalSavings); }
  if ('currency' in settings) { fields.push('currency = ?'); vals.push(settings.currency); }
  if (settings.notifications) {
    if ('budget' in settings.notifications) { fields.push('notificationBudget = ?'); vals.push(settings.notifications.budget ? 1 : 0); }
    if ('daily' in settings.notifications) { fields.push('notificationDaily = ?'); vals.push(settings.notifications.daily ? 1 : 0); }
  }
  
  if (fields.length > 0) {
    await db.run(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`, vals);
  }
}

export async function resetData(): Promise<void> {
  await db.execute('BEGIN TRANSACTION');
  try {
    await db.execute('DELETE FROM expenses');
    await db.execute('DELETE FROM wishlist');
    await db.run(`UPDATE settings SET 
      income=50000, 
      budget=20000, 
      savingsGoal=15000, 
      generalSavings=0, 
      currency='₹ INR', 
      notificationBudget=1, 
      notificationDaily=0 
      WHERE id=1`);
      
    if (originalSeed?.expenses?.length) {
      for (const ex of originalSeed.expenses) {
        await db.run('INSERT INTO expenses (id, amount, category, note, date) VALUES (?, ?, ?, ?, ?)', [ex.id, ex.amount, ex.category, ex.note, ex.date]);
      }
    }
    await db.execute('COMMIT');
  } catch (err) {
    await db.execute('ROLLBACK');
    throw err;
  }
}
