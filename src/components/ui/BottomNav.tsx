import React from 'react';
import { LayoutGrid, Plus, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Screen } from '../../App';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavProps {
  currentScreen: Screen;
  onChange: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onChange }: BottomNavProps) {
  const navItems: { id: Screen; icon: any; label: string }[] = [
    { id: 'DASHBOARD', icon: LayoutGrid, label: 'SYS' },
    { id: 'ADD', icon: Plus, label: 'ADD' },
    { id: 'INSIGHTS', icon: BarChart2, label: 'DATA' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-[90%] max-w-[400px]">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-around items-center h-[60px] sm:h-[68px] px-4 rounded-[20px] sm:rounded-[24px] relative overflow-hidden"
        style={{
          background: 'rgba(20, 20, 20, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Subtle inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

        {navItems.map(item => {
          const isActive = currentScreen === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center w-14 h-full transition-all duration-300 cursor-pointer",
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              )}
            >
              <div className="relative flex items-center justify-center">
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 bg-white/10 blur-[8px] rounded-full"
                    />
                  )}
                </AnimatePresence>
                <Icon 
                  size={24} 
                  strokeWidth={1.5} 
                  className={cn(
                    "relative z-10 transition-all duration-300",
                    isActive && "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  )} 
                />
              </div>
              {isActive && (
                <motion.div 
                  layoutId="nav-dot"
                  className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
