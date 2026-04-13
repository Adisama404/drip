import React, { useState } from 'react';
import { Category, Expense } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

export function ExpensesScreen({ expenses, onDelete, onNavigate }: { expenses: Expense[], onDelete: (id: string) => void, onNavigate: (s: string) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    const isSameMonth = d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    const isCategoryMatch = selectedCategory === 'ALL' || e.category === selectedCategory;
    return isSameMonth && isCategoryMatch;
  });

  const grouped = filteredExpenses.reduce((acc, exp) => {
    const dateStr = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    if (!acc[dateStr]) acc[dateStr] = { total: 0, items: [] };
    acc[dateStr].total += exp.amount;
    acc[dateStr].items.push(exp);
    return acc;
  }, {} as Record<string, { total: number, items: Expense[] }>);

  const categories: (Category | 'ALL')[] = ['ALL', 'FOOD', 'TRAVEL', 'SHOPPING', 'BILLS', 'SUBSCRIPTIONS', 'OTHER'];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-4 sm:pt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-8 px-1">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => onNavigate('DASHBOARD')} className="p-2 glass-card hover:bg-white hover:text-black transition-colors cursor-pointer">
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <h1 className="font-mono text-clamp-sm tracking-widest uppercase">Expenses</h1>
        </div>
        <Filter size={16} className="text-sys-muted sm:w-[18px] sm:h-[18px]" />
      </div>

      {/* Month Selector */}
      <div className="flex justify-between items-center glass-card p-3 sm:p-4">
        <button onClick={prevMonth} className="p-1 hover:text-white text-sys-muted transition-colors cursor-pointer"><ChevronLeft size={18} className="sm:w-5 sm:h-5" /></button>
        <span className="font-mono text-clamp-xs tracking-widest uppercase">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="p-1 hover:text-white text-sys-muted transition-colors cursor-pointer"><ChevronRight size={18} className="sm:w-5 sm:h-5" /></button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={cn(
              "font-mono text-[9px] sm:text-[10px] px-3 sm:px-4 py-2 border transition-all whitespace-nowrap cursor-pointer tracking-widest uppercase",
              selectedCategory === c 
                ? "bg-white text-black border-white" 
                : "bg-sys-dark text-sys-muted border-sys-border hover:border-sys-muted hover:text-white"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 font-mono text-sys-muted text-xs uppercase tracking-widest border border-sys-border border-dashed">
            No logs found
          </div>
        ) : (
          Object.entries(grouped).sort((a,b) => new Date(b[1].items[0].date).getTime() - new Date(a[1].items[0].date).getTime()).map(([date, data], groupIdx) => (
            <motion.div 
              key={date} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.1 }}
              className="space-y-4"
            >
              {/* Date Header */}
              <div className="flex justify-between items-center border-b border-sys-border pb-2">
                <span className="font-mono text-xs text-sys-muted tracking-widest">{date}</span>
                <span className="font-mono text-xs text-sys-muted tracking-widest">— ₹{data.total.toLocaleString()}</span>
              </div>
              
              {/* Items */}
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {data.items.map((exp, itemIdx) => (
                    <motion.div 
                      key={exp.id} 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ delay: itemIdx * 0.05 }}
                      className="flex justify-between items-center p-3 sm:p-4 glass-card group hover:border-sys-muted transition-colors gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 flex-1 min-w-0">
                        <span className="font-pixel text-lg sm:text-xl text-white whitespace-nowrap">₹{exp.amount}</span>
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] sm:text-xs text-white uppercase tracking-wider truncate">{exp.category}</div>
                          {exp.note && <div className="font-mono text-[8px] sm:text-[10px] text-sys-muted mt-0.5 truncate">{exp.note}</div>}
                        </div>
                      </div>
                      <button onClick={() => onDelete(exp.id)} className="text-sys-muted hover:text-sys-danger sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-2 shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
