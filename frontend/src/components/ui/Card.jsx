import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ className, children, ...props }) {
  return (
    <div 
      className={twMerge(
        clsx(
          'bg-slate-800/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl overflow-hidden',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}
