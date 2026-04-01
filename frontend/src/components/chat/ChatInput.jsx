import React, { useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export const ChatInput = ({ value, onChange, onSend, disabled, placeholder }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    // Keep focus unless disabled
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 bg-dark-800/80 backdrop-blur-xl border-t border-dark-600/50 mt-auto rounded-b-2xl">
      <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
        <div className="relative flex-1 bg-dark-900 rounded-xl border border-dark-600 shadow-sm focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all duration-200">
          <div className="absolute left-3 top-3.5 text-primary-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent border-0 py-3.5 pl-10 pr-4 text-slate-100 placeholder:text-slate-500 focus:ring-0 disabled:opacity-50"
          />
        </div>
        
        <Button 
          onClick={onSend} 
          disabled={disabled || !value.trim()} 
          size="icon" 
          className="rounded-xl h-[52px] w-[52px] shrink-0"
        >
          <Send className="w-5 h-5 -ml-0.5" />
        </Button>
      </div>
    </div>
  );
};
