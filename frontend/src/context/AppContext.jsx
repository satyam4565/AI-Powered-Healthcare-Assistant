import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  getChatHistory, 
  sendChatMessage, 
  getPatientAppointments,
  getDoctorAppointments,
  clearChat
} from '../services/api';
import { useAuth } from './AuthContext'; 

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user, token } = useAuth(); 

  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);
  
  const sessionId = useRef('');

  const fetchDashboard = async () => {
    if (!user) return;
    try {
      const data = user.role === 'doctor'
          ? await getDoctorAppointments()
          : await getPatientAppointments();
          
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load dashboard Data:", err);
    }
  };

  const fetchChatHistory = async (currentSessionId) => {
    try {
      const historyArray = await getChatHistory(currentSessionId);
      
      const uiMessages = historyArray.filter(m => {
        if (m.role !== 'user' && m.role !== 'assistant') return false;
        if (!m.content) return false;
        
        const contentStr = String(m.content).trim();
        if (m.role === 'assistant' && contentStr.startsWith('{') && contentStr.includes('"name"')) {
            return false;
        }
        return true;
      });
      
      setMessages(uiMessages);
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  };

  useEffect(() => {
    if (user && token) {
      sessionId.current = `session_${user.role}_${user.id}`;
      Promise.all([
        fetchChatHistory(sessionId.current),
        fetchDashboard()
      ]);
    } else {
      setDashboardData(null);
      setMessages([]);
      sessionId.current = '';
    }
  }, [user, token]); 

  const handleClearChat = async () => {
    if (!user) return;
    try {
      await clearChat(sessionId.current);
      setMessages([]); 
    } catch (err) {
      console.error("Failed to clear chat:", err);
    }
  };

  const handleSendMessage = async (inputValue) => {
    if (!inputValue.trim() || !user) return;

    const userMsg = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const resp = await sendChatMessage(userMsg.content, user.role, sessionId.current);
      
      let finalReply = resp.reply;

      if (finalReply.includes('||REPORT||')) {
        const firstSplit = finalReply.split('||REPORT||');
        
        if (firstSplit.length >= 3) {
           const reportText = firstSplit[1]; 

           toast(reportText, { 
             duration: 8000, 
             icon: '📋',
             style: { whiteSpace: 'pre-line' } 
           });
           finalReply = "I have generated your summary report. You should see it as a notification on your screen.";
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: finalReply }]);
      
      await fetchDashboard();
      
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `${err.message || "Something went wrong, please try again"}` }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        messages,
        isChatLoading,
        handleSendMessage,
        handleClearChat,
        dashboardData,
        refreshDashboard: fetchDashboard
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};