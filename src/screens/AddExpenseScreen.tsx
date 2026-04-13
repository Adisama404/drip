import React, { useState } from 'react';
import { Category, Expense } from '../types';
import { motion } from 'framer-motion';
import { CircularRing } from '../components/ui/CircularRing';
import { cn } from '../lib/utils';

export function AddExpenseScreen({ onAdd, budget, currentTotal, onNavigate }: { onAdd: (e: Expense) => void, budget: number, currentTotal: number, onNavigate: (s:string)=>void }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('FOOD');
  const [note, setNote] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  const numAmount = Number(amount) || 0;
  const currentPercentage = (currentTotal / budget) * 100;
  const newPercentage = ((currentTotal + numAmount) / budget) * 100;

  const handleSubmit = () => {
    if (!numAmount) return;
    onAdd({
      id: crypto.randomUUID(),
      amount: numAmount,
      category,
      note,
      date: date.toISOString()
    });
    onNavigate('DASHBOARD');
  };

  const categories: Category[] = ['FOOD', 'TRAVEL', 'SHOPPING', 'BILLS', 'SUBSCRIPTIONS', 'OTHER'];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="pb-24 pt-4 sm:pt-6 space-y-6 sm:space-y-8 w-full mx-auto"
    >
      <header className="text-center border-b border-sys-border pb-4">
        <h1 className="font-mono text-clamp-sm tracking-widest uppercase">Input Engine</h1>
      </header>

      {/* Amount Input */}
      <div className="flex justify-center items-center py-6 sm:py-8 relative">
        <span className="font-pixel text-clamp-2xl text-sys-muted mr-2">₹</span>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          className="bg-transparent font-pixel text-clamp-3xl text-white w-40 sm:w-48 text-center outline-none border-b-2 border-sys-border focus:border-white transition-all duration-300 relative z-10"
          autoFocus
        />
        {/* Cursor Glow */}
        <div className="absolute inset-x-0 bottom-6 sm:bottom-8 h-1 bg-white/20 blur-md pointer-events-none" />
      </div>

      {/* Date Selector */}
      <div className="space-y-3">
        <label className="font-mono text-[10px] text-sys-muted uppercase tracking-widest">Date</label>
        <div className="relative group">
          <div className="glass-card p-4 font-mono text-xs text-white flex justify-between items-center group-hover:border-sys-muted transition-all">
            <span>{date.toDateString()}</span>
            <span className="text-sys-muted">▼</span>
          </div>
          <input
            type="date"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
            value={date.toISOString().split("T")[0]}
            onChange={(e) => {
              const [year, month, day] = e.target.value.split('-').map(Number);
              setDate(new Date(year, month - 1, day));
            }}
          />
        </div>
      </div>

      {/* Category Selector */}
      <div className="space-y-3">
        <label className="font-mono text-[10px] text-sys-muted uppercase tracking-widest">Classification</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map((c, i) => (
            <motion.button
              key={c}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(c)}
              className={cn(
                "font-mono text-[10px] sm:text-xs px-2 sm:px-4 py-3 border transition-all cursor-pointer truncate",
                category === c 
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                  : "bg-transparent text-sys-muted border-sys-border hover:border-sys-muted hover:text-white"
              )}
            >
              {c}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Extra Inputs */}
      <div className="space-y-3">
        <label className="font-mono text-[10px] text-sys-muted uppercase tracking-widest">Parameters</label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Note (Optional)"
          className="w-full glass-card p-4 font-mono text-xs text-white focus:outline-none focus:border-white transition-all"
        />
      </div>

      {/* Impact Preview */}
      <motion.div 
        layout
        className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 w-full"
      >
        <div className="text-center sm:text-left w-full sm:w-auto">
          <p className="font-mono text-[10px] text-sys-muted uppercase mb-2">Impact Preview</p>
          <p className="font-pixel text-xl text-sys-danger truncate">+{numAmount}</p>
        </div>
        <div className="shrink-0">
          <CircularRing percentage={Math.min(newPercentage, 100)} size={80} thickness={10} color={newPercentage > 100 ? '#ff4444' : '#ffffff'} numSegments={20}>
            <span className="font-mono text-[10px]">{newPercentage.toFixed(0)}%</span>
          </CircularRing>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button 
        whileTap={{ scale: 0.96 }}
        onClick={handleSubmit}
        disabled={!numAmount}
        className="w-full glass-card py-4 font-mono text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white cursor-pointer relative overflow-hidden group"
      >
        <span className="relative z-10">[ Execute Transfer ]</span>
        <motion.div 
          className="absolute inset-0 bg-white opacity-0 group-active:opacity-10 transition-opacity"
        />
      </motion.button>
    </motion.div>
  );
}
