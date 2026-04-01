import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';

export const ChatContainer = ({ 
  messages, 
  isLoading, 
  inputValue, 
  setInputValue, 
  onSend,
  onClearChat
}) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Card className="flex flex-col h-full bg-slate-900/40 border-slate-700/50 backdrop-blur-md overflow-hidden">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Smart Assistant <Sparkles className="w-4 h-4 text-indigo-400" />
            </h2>
            <p className="text-xs text-slate-400">Powered by Secure MCP</p>
          </div>
        </div>
        
        {/* Right Side: Status & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-400">Online</span>
          </div>
          
          {/* Clear Chat Button (Only shows if there are messages) */}
          {messages.length > 0 && (
            <button 
              onClick={onClearChat}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
              title="Clear Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
              <Bot className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-center max-w-sm">
              Hello! I am your Smart Doctor Assistant. You can ask me to check availability or book an appointment.
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
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-4 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    isAi ? 'bg-indigo-900/50 border border-indigo-500/30 text-indigo-300' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {isAi ? <Bot size={16} /> : <UserIcon size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                    isAi 
                      ? 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-sm' 
                      : 'bg-indigo-600 text-white rounded-tr-sm'
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
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-lg">
              <Bot size={16} />
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5 w-16 h-10">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
            </div>
          </motion.div>
        )}
        
        {/* Invisible div to snap the scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800/80 border-t border-slate-700/50 backdrop-blur-md">
        <div className="relative flex items-center">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-4 pr-14 py-3.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none max-h-32 min-h-[52px]"
            rows={1}
          />
          <button
            onClick={onSend}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center justify-center group"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-2 font-medium tracking-wide uppercase">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </Card>
  );
};