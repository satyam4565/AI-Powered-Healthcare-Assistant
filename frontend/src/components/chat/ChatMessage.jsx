import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, CheckCircle2, AlertCircle, CalendarClock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Card } from '../ui/Card';

// Hook for typing effect over entire message or split by words
const useTypewriter = (text, speed = 10, enabled = true) => {
  const [displayedText, setDisplayedText] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) return;
    setDisplayedText("");
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(intervalId);
    }, speed);
    return () => clearInterval(intervalId);
  }, [text, speed, enabled]);

  return displayedText;
};

// Extremely basic heuristics for "Smart" message formatting
const parseSmartContent = (content) => {
  if (content.match(/appointment|booked|confirmed|scheduled/i) && !content.toLowerCase().includes('error')) {
    return { type: 'success', icon: CheckCircle2, text: content };
  }
  if (content.match(/error|fail|cannot database/i)) {
    return { type: 'error', icon: AlertCircle, text: content };
  }
  if (content.match(/availability|timeslot|slot/i)) {
    return { type: 'list', icon: CalendarClock, text: content };
  }
  return { type: 'text', icon: null, text: content };
};

export const ChatMessage = ({ message, isLatestResponse }) => {
  const isUser = message.role === 'user';
  const parsed = parseSmartContent(message.content);
  
  // Only animate if it's the latest assistant response
  const shouldAnimate = !isUser && isLatestResponse;
  const displayText = useTypewriter(parsed.text, 8, shouldAnimate);

  // Determine appearance based on parsed type (for Assistant)
  const getBubbleTheme = () => {
    if (isUser) return "bg-primary-600 text-white shadow-md shadow-primary-500/10";
    
    switch (parsed.type) {
      case 'success': return "bg-emerald-500/10 border border-emerald-500/20 text-emerald-50";
      case 'error': return "bg-red-500/10 border border-red-500/20 text-red-100";
      case 'list': return "bg-amber-500/10 border border-amber-500/20 text-amber-50";
      default: return "bg-dark-700/80 border border-dark-600/50 text-slate-200";
    }
  };

  const getIconColor = () => {
    switch (parsed.type) {
      case 'success': return "text-emerald-400";
      case 'error': return "text-red-400";
      case 'list': return "text-amber-400";
      default: return "text-primary-400";
    }
  };

  const SmartIcon = parsed.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full gap-4 mb-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-sm",
        isUser ? "bg-primary-500 border-primary-400" : "bg-dark-800 border-dark-600"
      )}>
        {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className={cn("w-5 h-5", getIconColor())} />}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <span className="text-xs font-semibold text-slate-400">
            {isUser ? "You" : "Smart Assistant"}
          </span>
          <span className="text-[10px] text-slate-500">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className={cn(
          "px-5 py-3.5 rounded-2xl whitespace-pre-wrap text-[15px] leading-relaxed",
          isUser ? "rounded-tr-sm" : "rounded-tl-sm",
          getBubbleTheme()
        )}>
          {/* Inject smart visual headers if any */}
          {!isUser && SmartIcon && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5 font-semibold">
              <SmartIcon className="w-4 h-4" />
              <span>{parsed.type.toUpperCase()}</span>
            </div>
          )}
          {shouldAnimate ? displayText : parsed.text}
          {shouldAnimate && displayText.length < parsed.text.length && (
            <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary-400 animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  );
};
