import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, AlertTriangle } from 'lucide-react';
import { Expense } from '../types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  onImport: (newExpenses: Expense[], strategy: ImportStrategy) => void;
}

export type ImportStrategy = 'ADD_NEW' | 'MERGE' | 'REPLACE_ALL';

export function ImportModal({ isOpen, onClose, expenses, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [strategy, setStrategy] = useState<ImportStrategy>('ADD_NEW');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      let rows: any[] = [];

      if (selectedFile.name.endsWith('.csv')) {
        const result = Papa.parse(data as string, { header: true, skipEmptyLines: true });
        rows = result.data;
      } else if (selectedFile.name.endsWith('.xlsx')) {
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(worksheet);
      }

      // Normalize columns
      const normalized = rows.map(row => {
        const getVal = (keys: string[]) => {
          const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
          return key ? row[key] : undefined;
        };

        return {
          date: getVal(['date', 'time', 'created', 'timestamp']),
          amount: getVal(['amount', 'amt', 'spent', 'cost', 'value', 'price']),
          category: getVal(['category', 'type', 'class', 'group']),
          title: getVal(['title', 'note', 'item', 'description', 'name'])
        };
      }).filter(r => r.date && r.amount); // basic validation

      setParsedData(normalized);
    };

    if (selectedFile.name.endsWith('.csv')) {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = () => {
    const newExpenses: Expense[] = parsedData.map(row => {
      // Try to parse date
      let dateStr = new Date().toISOString();
      try {
        if (row.date) {
          const parsedDate = new Date(row.date);
          if (!isNaN(parsedDate.getTime())) {
            dateStr = parsedDate.toISOString();
          }
        }
      } catch (e) {}

      // Try to parse amount
      let amount = 0;
      if (typeof row.amount === 'number') amount = row.amount;
      else if (typeof row.amount === 'string') amount = parseFloat(row.amount.replace(/[^0-9.-]+/g, ''));

      return {
        id: crypto.randomUUID(),
        amount: Math.abs(amount), // Reject negative visually, just take abs
        category: (row.category?.toString().toUpperCase() || 'OTHER') as any,
        note: row.title?.toString() || '',
        date: dateStr
      };
    }).filter(e => e.amount > 0);

    onImport(newExpenses, strategy);
    onClose();
    setFile(null);
    setParsedData([]);
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
            <h2 className="font-mono text-sm tracking-widest uppercase text-white">Import Data</h2>
            <button onClick={onClose} className="text-sys-muted hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {!file ? (
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${isDragging ? 'border-white bg-white/5' : 'border-sys-border hover:border-sys-muted'}`}
            >
              <Upload size={32} className={isDragging ? 'text-white' : 'text-sys-muted'} />
              <div className="text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-white">Drag & Drop OR Upload File</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-sys-muted mt-2">Supported: .xlsx, .csv</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border border-sys-border p-4 bg-black/20">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-sys-muted" />
                  <div>
                    <p className="font-mono text-xs text-white truncate max-w-[200px]">{file.name}</p>
                    <p className="font-mono text-[10px] text-sys-muted uppercase tracking-widest mt-1">{parsedData.length} valid rows detected</p>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setParsedData([]); }} className="text-sys-muted hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {parsedData.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[10px] text-sys-muted uppercase tracking-widest">Sample Preview</p>
                  <div className="border border-sys-border p-3 space-y-2 bg-black/20">
                    {parsedData.slice(0, 2).map((row, i) => (
                      <div key={i} className="flex justify-between font-mono text-[10px] text-sys-muted">
                        <span className="truncate w-1/3">{row.date?.toString().split('T')[0] || 'N/A'}</span>
                        <span className="truncate w-1/3 text-center">{row.title || 'N/A'}</span>
                        <span className="truncate w-1/3 text-right text-white">₹{row.amount || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="font-mono text-[10px] text-sys-muted uppercase tracking-widest">Import Strategy</p>
                <div className="space-y-2">
                  {(['ADD_NEW', 'MERGE', 'REPLACE_ALL'] as ImportStrategy[]).map(s => (
                    <label key={s} className="flex items-center gap-3 cursor-pointer group p-3 border border-sys-border hover:border-sys-muted transition-colors">
                      <div className={`w-4 h-4 border rounded-full flex items-center justify-center transition-colors ${strategy === s ? (s === 'REPLACE_ALL' ? 'border-sys-danger' : 'border-white') : 'border-sys-border group-hover:border-sys-muted'}`}>
                        {strategy === s && <div className={`w-2 h-2 rounded-full ${s === 'REPLACE_ALL' ? 'bg-sys-danger' : 'bg-white'}`} />}
                      </div>
                      <span className={`font-mono text-xs uppercase tracking-widest transition-colors ${strategy === s ? (s === 'REPLACE_ALL' ? 'text-sys-danger' : 'text-white') : 'text-sys-muted group-hover:text-white'}`}>
                        {s.replace('_', ' ')}
                      </span>
                      <input type="radio" className="hidden" checked={strategy === s} onChange={() => setStrategy(s)} />
                    </label>
                  ))}
                </div>
                {strategy === 'REPLACE_ALL' && (
                  <div className="flex items-start gap-2 text-sys-danger mt-2 p-3 bg-sys-danger/10 border border-sys-danger/30">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <p className="font-mono text-[9px] uppercase tracking-widest leading-relaxed">Warning: This will delete all existing expenses and replace them with the imported data.</p>
                  </div>
                )}
              </div>

              <button 
                onClick={handleImport}
                disabled={parsedData.length === 0}
                className="w-full glass-card py-4 font-mono text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white"
              >
                [ IMPORT {parsedData.length} ROWS ]
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
