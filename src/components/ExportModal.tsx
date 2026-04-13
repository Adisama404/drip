import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { Expense, WishlistItem, AppSettings } from '../types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  wishlist: WishlistItem[];
  settings: AppSettings;
}

type DateRange = 'THIS_MONTH' | 'SELECT_MONTH' | 'MULTIPLE_MONTHS' | 'CUSTOM' | 'ALL';
type Format = 'XLSX' | 'CSV';

export function ExportModal({ isOpen, onClose, expenses, wishlist, settings }: ExportModalProps) {
  const [dateRange, setDateRange] = useState<DateRange>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  
  const [types, setTypes] = useState({
    expenses: true,
    wishlist: true,
    savings: true
  });
  
  const [format, setFormat] = useState<Format>('XLSX');

  const handleExport = () => {
    // Filter data
    let filteredExpenses = [...expenses];
    let filteredWishlist = [...wishlist];

    const now = new Date();
    
    if (dateRange === 'THIS_MONTH') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filteredExpenses = filteredExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      filteredWishlist = filteredWishlist.filter(w => {
        const d = new Date(w.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (dateRange === 'SELECT_MONTH' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      filteredExpenses = filteredExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === Number(year) && d.getMonth() === Number(month) - 1;
      });
      filteredWishlist = filteredWishlist.filter(w => {
        const d = new Date(w.createdAt);
        return d.getFullYear() === Number(year) && d.getMonth() === Number(month) - 1;
      });
    } else if (dateRange === 'CUSTOM' && customStart && customEnd) {
      const start = new Date(customStart).getTime();
      const end = new Date(customEnd).getTime() + 86400000; // include end day
      filteredExpenses = filteredExpenses.filter(e => {
        const t = new Date(e.date).getTime();
        return t >= start && t <= end;
      });
      filteredWishlist = filteredWishlist.filter(w => {
        const t = new Date(w.createdAt).getTime();
        return t >= start && t <= end;
      });
    }

    const exportData: any = {};

    if (types.expenses) {
      exportData.Expenses = filteredExpenses.map(e => ({
        Date: new Date(e.date).toLocaleDateString(),
        Title: e.note || e.category,
        Category: e.category,
        Amount: e.amount
      }));
    }

    if (types.wishlist) {
      exportData.Wishlist = filteredWishlist.map(w => ({
        Name: w.name,
        Target: w.targetAmount,
        Saved: w.savedAmount,
        CreatedAt: new Date(w.createdAt).toLocaleDateString()
      }));
    }

    if (types.savings) {
      const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalSaved = (settings.generalSavings || 0) + filteredWishlist.reduce((sum, w) => sum + w.savedAmount, 0);
      exportData.Summary = [{
        Income: settings.income,
        Spent: totalSpent,
        Saved: totalSaved,
        FreeCapital: settings.income - totalSpent - totalSaved
      }];
    }

    if (format === 'XLSX') {
      const wb = XLSX.utils.book_new();
      Object.keys(exportData).forEach(sheetName => {
        const ws = XLSX.utils.json_to_sheet(exportData[sheetName]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
      XLSX.writeFile(wb, `Finance_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      // CSV
      Object.keys(exportData).forEach(sheetName => {
        const csv = Papa.unparse(exportData[sheetName]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sheetName}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md glass-card bg-sys-dark/90 p-6 space-y-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center border-b border-sys-border pb-4">
            <h2 className="font-mono text-sm tracking-widest uppercase text-white">Export Data</h2>
            <button onClick={onClose} className="text-sys-muted hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Data Range */}
          <div className="space-y-3">
            <label className="font-mono text-[10px] text-sys-muted uppercase tracking-widest">Data Range</label>
            <div className="grid grid-cols-2 gap-2">
              {(['THIS_MONTH', 'SELECT_MONTH', 'CUSTOM', 'ALL'] as DateRange[]).map(r => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`font-mono text-[10px] uppercase tracking-widest py-2 border transition-colors ${dateRange === r ? 'bg-white text-black border-white' : 'border-sys-border text-sys-muted hover:text-white hover:border-sys-muted'}`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
            
            {dateRange === 'SELECT_MONTH' && (
              <input 
                type="month" 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full bg-transparent border-b border-sys-border pb-2 font-mono text-xs text-white focus:outline-none focus:border-white mt-2" 
              />
            )}
            
            {dateRange === 'CUSTOM' && (
              <div className="flex gap-2 mt-2">
                <input 
                  type="date" 
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-full bg-transparent border-b border-sys-border pb-2 font-mono text-xs text-white focus:outline-none focus:border-white" 
                />
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-full bg-transparent border-b border-sys-border pb-2 font-mono text-xs text-white focus:outline-none focus:border-white" 
                />
              </div>
            )}
          </div>

          {/* Data Types */}
          <div className="space-y-3">
            <label className="font-mono text-[10px] text-sys-muted uppercase tracking-widest">Data Types</label>
            <div className="space-y-2">
              {Object.entries(types).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${value ? 'bg-white border-white' : 'border-sys-border bg-transparent group-hover:border-sys-muted'}`}>
                    {value && <div className="w-2 h-2 bg-black" />}
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-sys-muted group-hover:text-white transition-colors">{key}</span>
                  <input type="checkbox" className="hidden" checked={value} onChange={() => setTypes(p => ({...p, [key]: !p[key as keyof typeof types]}))} />
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="space-y-3">
            <label className="font-mono text-[10px] text-sys-muted uppercase tracking-widest">Format</label>
            <div className="flex gap-2">
              {(['XLSX', 'CSV'] as Format[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 font-mono text-[10px] uppercase tracking-widest py-2 border transition-colors ${format === f ? 'bg-white text-black border-white' : 'border-sys-border text-sys-muted hover:text-white hover:border-sys-muted'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button 
            onClick={handleExport}
            className="w-full glass-card py-4 font-mono text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Download size={16} /> EXPORT
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
