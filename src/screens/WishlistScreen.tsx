import React, { useState } from 'react';
import { WishlistItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { CountUp } from '../components/ui/CountUp';

export function WishlistScreen({ 
  wishlist, 
  freeCapital,
  onAdd, 
  onAllocate, 
  onPurchase, 
  onDelete, 
  onNavigate 
}: { 
  wishlist: WishlistItem[], 
  freeCapital: number,
  onAdd: (item: Omit<WishlistItem, 'id' | 'savedAmount' | 'createdAt'>) => void, 
  onAllocate: (id: string, amount: number) => void, 
  onPurchase: (id: string) => void, 
  onDelete: (id: string) => void, 
  onNavigate: (s: string) => void 
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [allocateAmounts, setAllocateAmounts] = useState<Record<string, string>>({});

  const handleAdd = () => {
    if (!name || !target) return;
    onAdd({
      name,
      targetAmount: Number(target),
    });
    setName('');
    setTarget('');
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-24 pt-4 sm:pt-8 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => onNavigate('DASHBOARD')} className="p-2 glass-card hover:bg-white hover:text-black transition-colors cursor-pointer">
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <h1 className="font-mono text-clamp-sm tracking-widest uppercase">Future Allocation</h1>
        </div>
        <div className="text-right">
          <p className="font-mono text-[8px] text-sys-muted uppercase tracking-widest">Free Capital</p>
          <p className="font-pixel text-clamp-base text-white">₹{freeCapital.toLocaleString()}</p>
        </div>
      </div>

      {/* Add Form */}
      <div className="glass-card p-4 sm:p-6 space-y-4">
        <p className="font-mono text-[10px] text-sys-muted uppercase tracking-widest">New Target</p>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="ITEM NAME" className="w-full bg-transparent border-b border-sys-border pb-2 font-mono text-xs text-white focus:outline-none focus:border-white transition-colors" />
        <input type="number" value={target} onChange={e=>setTarget(e.target.value)} placeholder="TARGET AMOUNT (₹)" className="w-full bg-transparent border-b border-sys-border pb-2 font-mono text-xs text-white focus:outline-none focus:border-white transition-colors" />
        <button onClick={handleAdd} className="w-full border border-sys-border py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors mt-2 cursor-pointer">
          [ SET TARGET ]
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {wishlist.length === 0 && (
          <div className="text-center py-12 font-mono text-sys-muted text-xs uppercase tracking-widest border border-sys-border border-dashed">
            No active targets
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {wishlist.map((item, idx) => {
            const progress = Math.min((item.savedAmount / item.targetAmount) * 100, 100);
            const remaining = item.targetAmount - item.savedAmount;
            const isReady = item.savedAmount >= item.targetAmount;

            return (
              <motion.div 
                key={item.id} 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-6 space-y-4 group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono text-sm text-white uppercase tracking-wider truncate">{item.name}</h3>
                    <p className="font-mono text-[10px] text-sys-muted mt-1 truncate">
                      ₹<CountUp value={item.savedAmount} /> / ₹<CountUp value={item.targetAmount} />
                    </p>
                  </div>
                  <button onClick={() => onDelete(item.id)} className="text-sys-muted hover:text-sys-danger sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-sys-border w-full relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-0 left-0 h-full bg-saved" 
                    style={{ backgroundColor: '#4ADE80' }} 
                  />
                </div>
                <div className="flex justify-between font-mono text-[9px] text-sys-muted uppercase tracking-widest">
                  <span className={isReady ? "text-saved" : ""}>{progress.toFixed(0)}% ALLOCATED</span>
                  <span>REMAINING: ₹{Math.max(0, remaining).toLocaleString()}</span>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-sys-border flex flex-col sm:flex-row gap-2">
                  <div className="flex border border-sys-border h-10">
                    <input 
                      type="number" 
                      placeholder="+ ₹" 
                      value={allocateAmounts[item.id] || ''}
                      onChange={e => setAllocateAmounts({...allocateAmounts, [item.id]: e.target.value})}
                      className="flex-1 bg-transparent px-3 font-mono text-[10px] text-white focus:outline-none min-w-0"
                    />
                    <button 
                      onClick={() => {
                        const amt = Number(allocateAmounts[item.id]);
                        if (amt > 0) {
                          if (amt > freeCapital) {
                            alert('Insufficient free capital');
                            return;
                          }
                          onAllocate(item.id, amt);
                          setAllocateAmounts({...allocateAmounts, [item.id]: ''});
                        }
                      }}
                      className="px-3 border-l border-sys-border font-mono text-[9px] hover:bg-white hover:text-black transition-colors cursor-pointer whitespace-nowrap"
                    >
                      ALLOCATE
                    </button>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onPurchase(item.id)}
                    className={cn(
                      "h-10 px-4 border border-sys-border font-mono text-[9px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer",
                      isReady ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]" : "hover:bg-white hover:text-black text-sys-muted"
                    )}
                  >
                    <CheckCircle size={12} /> PURCHASE
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
