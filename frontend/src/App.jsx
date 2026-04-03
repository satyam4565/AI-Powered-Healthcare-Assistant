import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';

// Auth
import Login from './components/auth/Login';

// Layout & Components
import { Header } from './components/layout/Header';
import { ChatContainer } from './components/chat/ChatContainer';
import { DoctorDashboard } from './components/dashboard/DoctorDashboard';
import { PatientDashboard } from './components/dashboard/PatientDashboard';

// Styles
import './index.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Public Route Wrapper (Redirects logged in users away from login)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const { user, loading: isAuthLoading } = useAuth();
  
  const { 
    messages,
    isChatLoading,
    handleSendMessage,
    handleClearChat,
    dashboardData
  } = useApp();

  const [inputValue, setInputValue] = useState('');

  const onSend = () => {
    if (!inputValue.trim()) return;
    handleSendMessage(inputValue);
    setInputValue('');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-slate-950 text-slate-100 flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="max-w-7xl mx-auto w-full flex flex-col h-full bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
              {/* Background Glowing Effects */}
              <div className="absolute top-0 -left-64 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 -right-64 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full gap-6">
                <Header />
                
                <div className="flex-1 flex overflow-hidden min-h-0">
                  {user?.role === 'doctor' ? (
                    // Doctor View: Native Full Grid view
                    <div className="w-full h-full overflow-y-auto pr-2 custom-scrollbar">
                       <DoctorDashboard data={dashboardData} />
                    </div>
                  ) : (
                    // Patient View: Split Screen
                    <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
                      {/* LEFT SIDEBAR: Mini Dashboard */}
                      <div className="w-full lg:w-[350px] shrink-0 h-full overflow-y-auto hidden lg:block custom-scrollbar">
                        <PatientDashboard user={user} data={dashboardData} />
                      </div>
                      
                      {/* MAIN AREA: Chat */}
                      <div className="flex-1 h-full min-w-0">
                        <ChatContainer 
                          messages={messages}
                          isLoading={isChatLoading}
                          inputValue={inputValue}
                          setInputValue={setInputValue}
                          onSend={onSend}
                          onClearChat={handleClearChat}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;