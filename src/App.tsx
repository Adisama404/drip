import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense, AppSettings, WishlistItem } from './types';
import { BottomNav } from './components/ui/BottomNav';
import { DashboardScreen } from './screens/DashboardScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { AddExpenseScreen } from './screens/AddExpenseScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WishlistScreen } from './screens/WishlistScreen';
import { ImportStrategy } from './components/ImportModal';
import { cn } from './lib/utils';

import { api, FinanceState } from './services/api';

export type Screen = 'DASHBOARD' | 'EXPENSES' | 'ADD' | 'INSIGHTS' | 'SETTINGS' | 'WISHLIST';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('DASHBOARD');
  const [finance, setFinance] = useState<FinanceState | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      const data = await api.getFinance();
      setFinance(data);
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAdd = async (expense: Omit<Expense, 'id'>) => {
    await api.addExpense(expense);
    await refreshData();
  };

  const handleDelete = async (id: string) => {
    await api.deleteExpense(id);
    await refreshData();
  };

  const handleReset = async () => {
    await api.resetSystem();
    await refreshData();
    setCurrentScreen('DASHBOARD');
  };

  const handleUpdateSettings = async (settings: Partial<AppSettings>) => {
    await api.updateSettings(settings);
    await refreshData();
  };

  const handleAddWishlist = async (item: Omit<WishlistItem, 'id' | 'savedAmount' | 'createdAt'>) => {
    await api.addWishlist(item);
    await refreshData();
  };
  
  const handleAllocate = async (id: string, amount: number) => {
    try {
      await api.allocateWishlist(id, amount);
      await refreshData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateGeneralSavings = async (amount: number) => {
    try {
      await api.addSavings(amount);
      await refreshData();
    } catch (error: any) {
      alert(error.message);
    }
  };
  
  const handlePurchase = async (id: string) => {
    try {
      await api.purchaseWishlist(id);
      await refreshData();
    } catch (error: any) {
      alert(error.message);
    }
  };
  
  const handleDeleteWishlist = async (id: string) => {
    await api.deleteWishlist(id);
    await refreshData();
  };

  const handleImport = async (newExpenses: Expense[], strategy: ImportStrategy) => {
    // This would need a backend endpoint for batch import
    // For now, I'll skip this or implement it simply
  };

  if (loading || !finance) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="font-mono text-xs text-sys-muted animate-pulse uppercase tracking-widest">
          Initializing System...
        </div>
      </div>
    );
  }

  const { expenses, settings, wishlist } = finance.raw;

  return (
    <div className="min-h-screen w-full font-sans selection:bg-white selection:text-black relative bg-black">
      <main className="container min-h-screen relative overflow-x-hidden pb-safe pt-safe">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full pb-32"
          >
            {currentScreen === 'DASHBOARD' && (
              <DashboardScreen 
                expenses={expenses} 
                settings={settings} 
                wishlist={wishlist} 
                finance={finance}
                onNavigate={setCurrentScreen} 
                onAddSavings={handleUpdateGeneralSavings} 
              />
            )}
            {currentScreen === 'EXPENSES' && (
              <ExpensesScreen 
                expenses={expenses} 
                onDelete={handleDelete} 
                onNavigate={setCurrentScreen} 
              />
            )}
            {currentScreen === 'ADD' && (
              <AddExpenseScreen 
                onAdd={handleAdd} 
                budget={settings.budget} 
                currentTotal={finance.spent} 
                onNavigate={setCurrentScreen} 
              />
            )}
            {currentScreen === 'INSIGHTS' && (
              <InsightsScreen 
                expenses={expenses} 
                budget={settings.budget} 
                income={settings.income} 
              />
            )}
            {currentScreen === 'SETTINGS' && (
              <SettingsScreen 
                settings={settings} 
                onUpdate={handleUpdateSettings} 
                onReset={handleReset} 
                expenses={expenses} 
                wishlist={wishlist} 
                onImport={handleImport} 
                onNavigate={setCurrentScreen} 
              />
            )}
            {currentScreen === 'WISHLIST' && (
              <WishlistScreen 
                wishlist={wishlist} 
                freeCapital={finance.free}
                onAdd={handleAddWishlist} 
                onAllocate={handleAllocate} 
                onPurchase={handlePurchase} 
                onDelete={handleDeleteWishlist} 
                onNavigate={setCurrentScreen} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav currentScreen={currentScreen} onChange={setCurrentScreen} />
    </div>
  );
}

