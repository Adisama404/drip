export type Category = 'FOOD' | 'TRAVEL' | 'SHOPPING' | 'BILLS' | 'SUBSCRIPTIONS' | 'OTHER';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  note: string;
  date: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  createdAt: string;
}

export interface AppSettings {
  income: number;
  budget: number;
  savingsGoal: number;
  generalSavings: number;
  currency: string;
  notifications: {
    budget: boolean;
    daily: boolean;
  };
}
