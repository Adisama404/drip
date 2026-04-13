import React from 'react';
import { AppSettings, Expense } from '../types';
import { CircularRing } from '../components/ui/CircularRing';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Settings, Plus, Wallet, ShieldCheck } from 'lucide-react';
import { CountUp } from '../components/ui/CountUp';
import type { FinanceState } from '../services';

const CATEGORY_COLORS: Record<string, string> = {
  'FOOD': '#4ade80',
  'TRAVEL': '#60a5fa',
  'SHOPPING': '#f87171',
  'BILLS': '#fcd34d',
  'SUBSCRIPTIONS': '#fb923c',
  'OTHER': '#ffffff',
};

export function DashboardScreen({ 
  expenses, 
  settings, 
  wishlist, 
  finance,
  onNavigate,
  onAddSavings
}: { 
  expenses: Expense[], 
  settings: AppSettings, 
  wishlist: any[], 
  finance: FinanceState,
  onNavigate: (s: string) => void,
  onAddSavings: (amt: number) => void
}) {
  const [isAddingSavings, setIsAddingSavings] = React.useState(false);
  const [savingsAmount, setSavingsAmount] = React.useState('');

  const { spent, saved, free, income, savingsBreakdown } = finance;
  const percentage = Math.min((spent / income) * 100, 100);

  // Calculate category segments for the ring
  const ringSegments = React.useMemo(() => {
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        percentage: (amount / income) * 100,
        color: CATEGORY_COLORS[category] || '#ffffff',
        label: category,
        amount: amount
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [expenses, income]);
  
  const recentExpenses = [...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  const handleAddSavings = () => {
    const amt = Number(savingsAmount);
    if (amt > 0 && amt <= free) {
      onAddSavings(amt);
      setSavingsAmount('');
      setIsAddingSavings(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="pb-24 space-y-6 pt-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between px-2 mb-4 w-full pt-2">
        {/* Logo */}
        <div className="flex items-center -ml-2">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </div>

        {/* Centered Date */}
        <h1 className="font-mono text-clamp-xs sm:text-clamp-sm tracking-widest uppercase text-white whitespace-nowrap mx-2 truncate">
          {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </h1>
        
        {/* Right Actions */}
        <div className="flex gap-3 sm:gap-4 shrink-0">
          <button 
            onClick={() => onNavigate('WISHLIST')} 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center glass-card text-sys-muted hover:text-white transition-colors cursor-pointer p-0"
          >
            <Target size={24} className="sm:w-6 sm:h-6" />
          </button>
          <button 
            onClick={() => onNavigate('SETTINGS')} 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center glass-card text-sys-muted hover:text-white transition-colors cursor-pointer p-0"
          >
            <Settings size={24} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </motion.div>

      {/* Primary Circular Chart */}
      <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 sm:gap-8 py-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center w-full"
        >
          <CircularRing 
            percentage={percentage} 
            size={260} 
            thickness={36} 
            numSegments={44}
            segments={ringSegments}
            tintColor={percentage > 100 ? '#F87171' : undefined}
          >
            <span className="font-pixel text-clamp-2xl mb-1 text-white">
              ₹<CountUp value={spent} />
            </span>
            <span className="font-mono text-[9px] sm:text-[10px] text-sys-muted tracking-tight uppercase">
              {percentage.toFixed(0)}% spent this month
            </span>
          </CircularRing>
        </motion.div>
      </motion.div>

      {/* Savings & Liquidity System */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <motion.div variants={itemVariants} className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="font-mono text-[9px] sm:text-[10px] text-sys-muted uppercase tracking-widest">Total Saved</p>
              <h2 className="font-pixel text-clamp-xl text-saved">
                ₹<CountUp value={saved} />
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-4 font-mono text-[8px] sm:text-[9px] text-sys-muted uppercase tracking-tighter">
                <span>General: ₹<CountUp value={savingsBreakdown.general} /></span>
                <span>Wishlist: ₹<CountUp value={savingsBreakdown.wishlist} /></span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-sys-border">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-1">
                <p className="font-mono text-[9px] sm:text-[10px] text-sys-muted uppercase tracking-widest">Free Capital</p>
                <p className="font-pixel text-clamp-lg text-free">
                  ₹<CountUp value={free} />
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isAddingSavings ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAddingSavings(true)}
                  className="w-full py-3 border border-sys-info/30 text-sys-info font-mono text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-sys-info hover:text-white transition-all cursor-pointer"
                >
                  [ + Add to Savings ]
                </motion.button>
              ) : (
                <motion.div
                  key="add-input"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="flex gap-2"
                >
                  <input 
                    autoFocus
                    type="number"
                    placeholder="AMOUNT"
                    value={savingsAmount}
                    onChange={e => setSavingsAmount(e.target.value)}
                    className="flex-1 bg-sys-dark border border-sys-border px-3 sm:px-4 py-2 font-mono text-xs text-white focus:outline-none focus:border-sys-info"
                  />
                  <button 
                    onClick={handleAddSavings}
                    className="px-3 sm:px-4 py-2 bg-sys-info text-white font-mono text-[9px] sm:text-[10px] uppercase cursor-pointer"
                  >
                    OK
                  </button>
                  <button 
                    onClick={() => setIsAddingSavings(false)}
                    className="px-3 sm:px-4 py-2 border border-sys-border text-sys-muted font-mono text-[9px] sm:text-[10px] uppercase cursor-pointer"
                  >
                    X
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Recent Expenses */}
        <motion.div variants={itemVariants} className="glass-card p-4 sm:p-6">
          <div className="flex justify-between items-center border-b border-dotted border-sys-border pb-4 mb-4 sm:mb-6">
            <span className="font-mono text-clamp-xs tracking-widest uppercase text-sys-muted">Recent Logs</span>
            <button onClick={() => onNavigate('EXPENSES')} className="font-mono text-[8px] sm:text-[9px] text-sys-info hover:underline cursor-pointer">
              VIEW ALL
            </button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentExpenses.length === 0 ? (
              <p className="font-mono text-[9px] sm:text-[10px] text-sys-muted text-center py-4 uppercase">No recent activity</p>
            ) : (
              recentExpenses.map((exp, i) => (
                <motion.div 
                  key={exp.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex justify-between items-center group w-full gap-2"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-mono text-clamp-xs text-white uppercase truncate">{exp.note || exp.category}</span>
                    <span className="font-mono text-[7px] sm:text-[8px] text-sys-muted truncate">{new Date(exp.date).toLocaleDateString()}</span>
                  </div>
                  <span className="font-pixel text-clamp-base text-spent shrink-0">-₹{exp.amount.toLocaleString()}</span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}


