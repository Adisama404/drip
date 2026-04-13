import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { CircularRing } from '../components/ui/CircularRing';
import { CountUp } from '../components/ui/CountUp';

const CATEGORY_TINTS: Record<string, string> = {
  'FOOD': '#4ade80',     // Slight green tint
  'TRAVEL': '#60a5fa',   // Slight blue tint
  'SHOPPING': '#f87171', // Slight red tint
  'BILLS': '#fcd34d',    // Slight yellow tint
  'SUBSCRIPTIONS': '#c084fc', // Slight purple tint
  'OTHER': '#ffffff',
};

export function InsightsScreen({ expenses, budget, income }: { expenses: Expense[], budget: number, income: number }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Current Month Data
  const filteredExpenses = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  }), [expenses, currentDate]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetPercentage = Math.min((totalSpent / budget) * 100, 100);
  const isOverBudget = totalSpent > budget;

  // Last Month Data (for comparison)
  const lastMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1), [currentDate]);
  const lastMonthTotal = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, lastMonth]);

  const comparisonText = useMemo(() => {
    if (lastMonthTotal === 0) return null;
    const diff = totalSpent - lastMonthTotal;
    const percent = (diff / lastMonthTotal) * 100;
    const isUp = percent > 0;
    return (
      <span className={cn("font-mono text-[10px] tracking-widest uppercase", isUp ? "text-sys-danger" : "text-sys-info")}>
        {isUp ? '↑' : '↓'} {Math.abs(percent).toFixed(0)}% vs {lastMonth.toLocaleDateString('en-US', { month: 'short' })}
      </span>
    );
  }, [totalSpent, lastMonthTotal, lastMonth]);

  // Category Distribution
  const categoryData = useMemo(() => {
    const data = filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(data).map(([name, value]) => ({ name, value: Number(value) })).sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);

  // Trend Data (Daily for the month)
  const trendData = useMemo(() => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dailyTotal = filteredExpenses
        .filter(e => e.date.startsWith(dateStr))
        .reduce((sum, e) => sum + e.amount, 0);
      data.push({ day: i, total: dailyTotal });
    }
    return data;
  }, [filteredExpenses, currentDate]);

  // Weekday Data
  const weekdayData = useMemo(() => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const data = days.map(day => ({ day, total: 0 }));
    filteredExpenses.forEach(exp => {
      const d = new Date(exp.date);
      data[d.getDay()].total += exp.amount;
    });
    // Shift so Monday is first
    return [...data.slice(1), data[0]];
  }, [filteredExpenses]);

  // Insights
  const highestDay = [...trendData].sort((a,b) => b.total - a.total)[0];
  const highestCategory = categoryData[0];
  
  const weekendTotal = weekdayData.find(d => d.day === 'SAT')!.total + weekdayData.find(d => d.day === 'SUN')!.total;
  const weekdayTotal = totalSpent - weekendTotal;
  const avgWeekendDay = weekendTotal / 2;
  const avgWeekday = weekdayTotal / 5;
  const spikesOnWeekends = avgWeekendDay > avgWeekday * 1.5;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="pb-24 pt-4 sm:pt-8 space-y-8 sm:space-y-12"
    >
      
      {/* 1. HEADER + CONTEXT */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 sm:space-y-6"
      >
        <div className="flex justify-between items-center text-sys-muted font-mono text-[9px] sm:text-[10px] tracking-widest uppercase">
          <button onClick={prevMonth} className="p-2 hover:text-white transition-colors cursor-pointer flex items-center gap-1">
            <ChevronLeft size={14} />
          </button>
          <span className="text-white text-clamp-xs">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:text-white transition-colors cursor-pointer flex items-center gap-1">
             <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <span className="font-pixel text-clamp-3xl text-white">
            ₹<CountUp value={totalSpent} />
          </span>
          {comparisonText && <div className="text-clamp-xs">{comparisonText}</div>}
        </div>
      </motion.div>

      {/* 2. BUDGET PERFORMANCE (RING) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <CircularRing 
          percentage={budgetPercentage} 
          size={200} 
          thickness={20} 
          numSegments={40}
          tintColor={isOverBudget ? '#f87171' : '#4ade80'}
        >
          <span className="font-pixel text-clamp-xl mb-1">₹<CountUp value={totalSpent} /></span>
          <span className="font-mono text-[8px] sm:text-[9px] text-sys-muted tracking-widest uppercase">
            {budgetPercentage.toFixed(0)}% OF ₹{budget.toLocaleString()}
          </span>
        </CircularRing>
      </motion.div>

      {/* 3. CATEGORY DISTRIBUTION */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 space-y-6"
      >
        <h2 className="font-mono text-[10px] text-sys-muted uppercase tracking-widest border-b border-sys-border pb-2">Category Distribution</h2>
        <div className="space-y-4">
          {categoryData.length === 0 ? (
            <div className="text-sys-muted font-mono text-xs text-center py-4">NO DATA</div>
          ) : (
            categoryData.map((cat, idx) => {
              const percentage = (cat.value / totalSpent) * 100;
              const color = CATEGORY_TINTS[cat.name] || '#ffffff';
              const totalBlocks = 20;
              const activeBlocks = Math.max(1, Math.round((percentage / 100) * totalBlocks));

              return (
                <motion.div 
                  key={cat.name} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  className="flex items-center gap-2 sm:gap-3 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest group cursor-pointer"
                >
                  <span className="text-white w-14 sm:w-16 truncate group-hover:text-sys-accent transition-colors">{cat.name}</span>
                  <div className="flex-1 flex gap-[2px] h-2 min-w-0">
                    {Array.from({ length: totalBlocks }).map((_, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.5 + idx * 0.05 + i * 0.01 }}
                        className="flex-1 transition-all"
                        style={{ 
                          backgroundColor: i < activeBlocks ? color : '#111111',
                          opacity: i < activeBlocks ? 1 - (i * 0.04) : 1,
                          filter: i < activeBlocks ? `drop-shadow(0 0 2px ${color}40)` : 'none'
                        }} 
                      />
                    ))}
                  </div>
                  <span className="text-white w-12 sm:w-16 text-right truncate">₹{cat.value.toLocaleString()}</span>
                  <span className="text-sys-muted w-6 sm:w-8 text-right">{percentage.toFixed(0)}%</span>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* 4. SPENDING TREND */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 space-y-6"
      >
        <h2 className="font-mono text-[10px] text-sys-muted uppercase tracking-widest border-b border-sys-border pb-2">Spending Trend</h2>
        <div className="h-[160px] w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 9, fontFamily: 'Space Mono, monospace' }} dy={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: 0, fontFamily: 'Space Mono, monospace', fontSize: '10px' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#666', marginBottom: '4px' }}
                cursor={{ stroke: '#333', strokeWidth: 1, strokeDasharray: '4 4' }}
                formatter={(value: number) => [`₹${value}`, 'Spent']}
                labelFormatter={(label) => `Day ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#ffffff" 
                strokeWidth={1.5} 
                dot={false}
                animationDuration={1500}
                activeDot={{ r: 4, fill: '#60A5FA', stroke: '#fff', strokeWidth: 2 }} 
                style={{ filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.3))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 5. WEEKDAY / PATTERN ANALYSIS */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 space-y-6"
      >
        <h2 className="font-mono text-[10px] text-sys-muted uppercase tracking-widest border-b border-sys-border pb-2">Pattern Analysis</h2>
        <div className="h-[100px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 9, fontFamily: 'Space Mono, monospace' }} dy={10} />
              <Tooltip 
                cursor={{fill: '#111'}} 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: 0, fontFamily: 'Space Mono, monospace', fontSize: '10px' }} 
                itemStyle={{ color: '#fff' }} 
                formatter={(val: number) => [`₹${val}`, 'Total']} 
              />
              <Bar dataKey="total" radius={[2, 2, 0, 0]} animationDuration={1000}>
                {weekdayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.total === Math.max(...weekdayData.map(d=>d.total)) && entry.total > 0 ? '#ffffff' : '#333333'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 6. KEY INSIGHTS */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6 space-y-6"
      >
        <h2 className="font-mono text-[10px] text-sys-muted uppercase tracking-widest border-b border-sys-border pb-2">Key Insights</h2>
        <ul className="space-y-3 font-mono text-xs text-sys-muted leading-relaxed list-disc pl-4">
          {highestDay && highestDay.total > 0 && (
            <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              Highest spending: <span className="text-white">{highestDay.day} {currentDate.toLocaleString('default', { month: 'long' })}</span>
            </motion.li>
          )}
          {highestCategory && (
            <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              <span className="text-white">{highestCategory.name}</span> accounts for <span className="text-white">{((highestCategory.value / totalSpent) * 100).toFixed(0)}%</span> of spending
            </motion.li>
          )}
          {spikesOnWeekends && totalSpent > 0 && (
            <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              Spending <span className="text-sys-danger">spikes on weekends</span>
            </motion.li>
          )}
          {!spikesOnWeekends && totalSpent > 0 && (
            <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              Spending is concentrated on <span className="text-white">weekdays</span>
            </motion.li>
          )}
          {totalSpent === 0 && (
            <li className="list-none -ml-4">No activity detected in current cycle.</li>
          )}
        </ul>
      </motion.div>

    </motion.div>
  );
}
