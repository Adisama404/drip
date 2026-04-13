import React from 'react';
import { AppSettings, Expense, WishlistItem } from '../types';
import { motion } from 'framer-motion';
import { CircularRing } from '../components/ui/CircularRing';
import { Trash2, Download, Bell, CreditCard, Target, Wallet, Upload, ArrowLeft } from 'lucide-react';
import { ExportModal } from '../components/ExportModal';
import { ImportModal, ImportStrategy } from '../components/ImportModal';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onReset: () => void;
  expenses: Expense[];
  wishlist: WishlistItem[];
  onImport: (newExpenses: Expense[], strategy: ImportStrategy) => void;
  onNavigate: (s: any) => void;
}

export function SettingsScreen({ settings, onUpdate, onReset, expenses, wishlist, onImport, onNavigate }: SettingsScreenProps) {
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const currentTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const incomeAllocated = (settings.budget / settings.income) * 100;
  
  const wishlistAllocated = wishlist.reduce((sum, item) => sum + item.savedAmount, 0);
  const totalAllocated = (settings.generalSavings || 0) + wishlistAllocated;
    
  const savingsProgress = (totalAllocated / settings.savingsGoal) * 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 sm:pt-6 space-y-8 sm:space-y-10">
      <header className="border-b border-sys-border pb-4 flex items-center gap-3 sm:gap-4 px-1">
        <button 
          onClick={() => onNavigate('DASHBOARD')} 
          className="p-2 glass-card hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
        </button>
        <div>
          <h1 className="font-mono text-clamp-sm tracking-widest uppercase">Settings</h1>
          <p className="font-mono text-[9px] sm:text-[10px] text-sys-muted uppercase tracking-widest mt-1">System Config</p>
        </div>
      </header>

      {/* Financial Config */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={14} className="text-sys-muted" />
          <h2 className="font-mono text-xs tracking-widest uppercase">Financial Config</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between glass-card p-4 sm:p-6 gap-6 sm:gap-8">
            <div className="space-y-4 w-full sm:flex-1">
              <div>
                <label className="font-mono text-[9px] text-sys-muted uppercase block mb-1">Monthly Income</label>
                <div className="flex items-center border-b border-sys-border focus-within:border-white transition-colors">
                  <span className="font-pixel text-xl mr-2">₹</span>
                  <input 
                    type="number" 
                    value={settings.income} 
                    onChange={e => onUpdate({...settings, income: Number(e.target.value)})}
                    className="bg-transparent font-pixel text-xl sm:text-2xl text-white outline-none w-full py-1"
                  />
                </div>
              </div>
              <div>
                <label className="font-mono text-[9px] text-sys-muted uppercase block mb-1">Spending Limit</label>
                <div className="flex items-center border-b border-sys-border focus-within:border-white transition-colors">
                  <span className="font-pixel text-xl mr-2">₹</span>
                  <input 
                    type="number" 
                    value={settings.budget} 
                    onChange={e => onUpdate({...settings, budget: Number(e.target.value)})}
                    className="bg-transparent font-pixel text-xl sm:text-2xl text-white outline-none w-full py-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <CircularRing percentage={incomeAllocated} size={100} thickness={12} numSegments={20}>
                <span className="font-mono text-[10px]">{incomeAllocated.toFixed(0)}%</span>
              </CircularRing>
              <p className="font-mono text-[8px] text-sys-muted uppercase mt-2 text-center">Budget / Income</p>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Tracker */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Target size={14} className="text-sys-muted" />
          <h2 className="font-mono text-xs tracking-widest uppercase">Savings Tracker</h2>
        </div>

        <div className="glass-card p-4 sm:p-6 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="w-full sm:flex-1">
              <label className="font-mono text-[9px] text-sys-muted uppercase block mb-1">Savings Goal</label>
              <div className="flex items-center border-b border-sys-border focus-within:border-white transition-colors w-full">
                <span className="font-pixel text-xl mr-2">₹</span>
                <input 
                  type="number" 
                  value={settings.savingsGoal} 
                  onChange={e => onUpdate({...settings, savingsGoal: Number(e.target.value)})}
                  className="bg-transparent font-pixel text-xl sm:text-2xl text-white outline-none w-full py-1"
                />
              </div>
            </div>
            <div className="w-full sm:flex-1">
              <label className="font-mono text-[9px] text-sys-muted uppercase block mb-1">General Savings</label>
              <div className="flex items-center border-b border-sys-border focus-within:border-white transition-colors w-full">
                <span className="font-pixel text-xl mr-2">₹</span>
                <input 
                  type="number" 
                  value={settings.generalSavings || 0} 
                  onChange={e => onUpdate({...settings, generalSavings: Number(e.target.value)})}
                  className="bg-transparent font-pixel text-xl sm:text-2xl text-white outline-none w-full py-1"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center py-4">
            <CircularRing 
              percentage={Math.min(savingsProgress, 100)} 
              size={160} 
              thickness={20} 
              numSegments={30}
              tintColor="#4ADE80"
            >
              <span className="font-pixel text-xl">₹{totalAllocated.toLocaleString()}</span>
              <span className="font-mono text-[9px] text-sys-muted mt-1">/ ₹{settings.savingsGoal.toLocaleString()}</span>
            </CircularRing>
            <p className="font-mono text-[10px] text-sys-muted uppercase mt-4 tracking-widest">Savings Progress</p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-dotted border-sys-border">
            <div>
              <p className="font-mono text-[8px] text-sys-muted uppercase">Total Allocated</p>
              <p className="font-pixel text-lg">₹{totalAllocated.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Preferences */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={14} className="text-sys-muted" />
          <h2 className="font-mono text-xs tracking-widest uppercase">System Preferences</h2>
        </div>

        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-white">Currency</span>
            <span className="font-mono text-xs text-sys-muted border border-sys-border px-2 py-1">{settings.currency}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-white">Budget Alerts</span>
            <button 
              onClick={() => onUpdate({...settings, notifications: {...settings.notifications, budget: !settings.notifications.budget}})}
              className={`w-10 h-5 border border-sys-border relative transition-colors ${settings.notifications.budget ? 'bg-white' : 'bg-transparent'}`}
            >
              <div className={`absolute top-0.5 w-3.5 h-3.5 border border-sys-border transition-all ${settings.notifications.budget ? 'right-0.5 bg-black' : 'left-0.5 bg-white'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-white">Daily Reminder</span>
            <button 
              onClick={() => onUpdate({...settings, notifications: {...settings.notifications, daily: !settings.notifications.daily}})}
              className={`w-10 h-5 border border-sys-border relative transition-colors ${settings.notifications.daily ? 'bg-white' : 'bg-transparent'}`}
            >
              <div className={`absolute top-0.5 w-3.5 h-3.5 border border-sys-border transition-all ${settings.notifications.daily ? 'right-0.5 bg-black' : 'left-0.5 bg-white'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Data Control */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={14} className="text-sys-muted" />
          <h2 className="font-mono text-xs tracking-widest uppercase">Data Control</h2>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => setIsExportOpen(true)}
            className="w-full glass-card p-4 flex items-center justify-between hover:bg-white hover:text-black transition-all group cursor-pointer"
          >
            <span className="font-mono text-xs uppercase tracking-widest">Export Data</span>
            <Download size={16} className="text-sys-muted group-hover:text-black" />
          </button>

          <button 
            onClick={() => setIsImportOpen(true)}
            className="w-full glass-card p-4 flex items-center justify-between hover:bg-white hover:text-black transition-all group cursor-pointer"
          >
            <span className="font-mono text-xs uppercase tracking-widest">Import Data</span>
            <Upload size={16} className="text-sys-muted group-hover:text-black" />
          </button>

          <button 
            onClick={() => {
              if(confirm('CRITICAL: ALL DATA WILL BE ERASED. PROCEED?')) {
                onReset();
              }
            }}
            className="w-full glass-card red p-4 flex items-center justify-between hover:bg-sys-danger hover:text-white transition-all group cursor-pointer"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-sys-danger group-hover:text-white">Reset System</span>
            <Trash2 size={16} className="text-sys-danger group-hover:text-white" />
          </button>
        </div>
      </section>
      {/* Modals */}
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        expenses={expenses} 
        wishlist={wishlist} 
        settings={settings} 
      />
      
      <ImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        expenses={expenses} 
        onImport={onImport} 
      />
    </motion.div>
  );
}
