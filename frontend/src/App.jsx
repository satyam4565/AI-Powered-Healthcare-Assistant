import React, { useState } from 'react';
import { useAuth } from './context/AuthContext'; // NEW: Handles Auth
import { useApp } from './context/AppContext';   // EXISTING: Handles Chat

// Auth
import Login from './components/auth/Login';

// Layout & Components
import { Header } from './components/layout/Header';
import { SplitLayout } from './components/layout/SplitLayout';
import { ChatContainer } from './components/chat/ChatContainer';
import { Dashboard } from './components/dashboard/Dashboard';

// Styles
import './index.css';

function App() {
  // 1. Pull Auth state from our NEW AuthContext
  const { user, loading: isAuthLoading } = useAuth();

  // 2. Pull Chat state from your EXISTING AppContext
  const { 
    messages,
    isChatLoading,
    handleSendMessage,
    handleClearChat
  } = useApp();

  const [inputValue, setInputValue] = useState('');

  const onSend = () => {
    if (!inputValue.trim()) return;
    handleSendMessage(inputValue);
    setInputValue('');
  };

  // ---------------- LOADING SCREEN ----------------
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  // ---------------- SHOW LOGIN ----------------
  // The Login component now handles its own login process!
  if (!user) {
    return <Login />;
  }

  // ---------------- MAIN APP ----------------
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full bg-slate-800/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Background Glowing Effects */}
        <div className="absolute top-0 -left-64 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 -right-64 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full gap-4">
          <Header />
          
          <SplitLayout 
            showRightPanel={true}
            leftPanel={
              <ChatContainer 
                messages={messages}
                isLoading={isChatLoading}
                role={user.role}
                inputValue={inputValue}
                setInputValue={setInputValue}
                onSend={onSend}
                onClearChat={handleClearChat}
              />
            }
            rightPanel={
              <Dashboard />
            }
          />
        </div>
      </div>
    </div>
  );
}

export default App;