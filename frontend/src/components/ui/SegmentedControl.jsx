import React from 'react';
import { motion } from 'framer-motion';

export function SegmentedControl({ options, selected, onChange }) {
  return (
    <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl relative">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`relative flex-1 py-2 text-sm font-medium z-10 transition-colors duration-200 ${
              isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="segmented-bg"
                className="absolute inset-0 bg-slate-700/80 rounded-lg -z-10 shadow-sm border border-slate-600/50"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
