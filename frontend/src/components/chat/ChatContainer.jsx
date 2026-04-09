import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Trash2, Activity } from 'lucide-react';

const TYPING_MESSAGES = [
  "Analyzing request...",
  "Checking doctor's schedule...",
  "Finding available slots...",
  "Booking appointment...",
  "Updating records..."
];

export const ChatContainer = ({
  messages = [],
  isLoading,
  inputValue,
  setInputValue,
  onSend,
  onClearChat
}) => {
  const messagesEndRef = useRef(null);
  const [typingIndex, setTypingIndex] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      setTypingIndex(0);
      interval = setInterval(() => {
        setTypingIndex(prev => (prev + 1) % TYPING_MESSAGES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    // REMOVED fixed heights and heavy backgrounds. Added h-full and w-full.
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Smart Assistant <Sparkles className="w-3 h-3 text-blue-500" />
            </h2>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Powered by Secure AI</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] uppercase font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
          </div>

          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Clear Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
              <Bot className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-center max-w-sm text-sm font-medium text-slate-500 dark:text-slate-400">
              Hello! I am your AI Assistant. You can ask me to check availability or book an appointment.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isAi = msg.role === 'assistant';
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex items-start gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isAi ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-200 text-slate-600'}`}>
                    {isAi ? <Bot size={16} /> : <UserIcon size={16} />}
                  </div>
                  <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-[13px] whitespace-pre-wrap leading-relaxed shadow-sm ${isAi
                    ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                    }`}>
                    {msg.content}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Typing Indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center gap-2 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                <Activity size={12} className="animate-pulse" />
                <AnimatePresence mode="wait">
                  <motion.span key={typingIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                    {TYPING_MESSAGES[typingIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="relative flex items-center">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a medical question or request an appointment..."
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-14 py-3.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none max-h-32 min-h-[52px]"
            rows={1}
          />
          <button
            onClick={onSend}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors flex items-center justify-center outline-none"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};