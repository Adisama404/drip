import { Expense, AppSettings, WishlistItem } from '../types';

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

export const api = {
  async getFinance(): Promise<FinanceState> {
    const res = await fetch('/api/finance');
    return res.json();
  },

  async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const res = await fetch('/api/expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });
    return res.json();
  },

  async deleteExpense(id: string): Promise<void> {
    await fetch(`/api/expense/${id}`, { method: 'DELETE' });
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async addSavings(amount: number): Promise<AppSettings> {
    const res = await fetch('/api/savings/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add savings');
    }
    return res.json();
  },

  async addWishlist(item: Omit<WishlistItem, 'id' | 'savedAmount' | 'createdAt'>): Promise<WishlistItem> {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  },

  async allocateWishlist(id: string, amount: number): Promise<WishlistItem> {
    const res = await fetch('/api/wishlist/allocate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to allocate funds');
    }
    return res.json();
  },

  async deleteWishlist(id: string): Promise<void> {
    await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
  },

  async purchaseWishlist(id: string): Promise<void> {
    const res = await fetch('/api/wishlist/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Purchase failed');
    }
  },

  async resetSystem(): Promise<void> {
    await fetch('/api/reset', { method: 'POST' });
  }
};
