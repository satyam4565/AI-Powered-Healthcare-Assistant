import React from 'react';
import { HeartPulse, User, LogOut } from 'lucide-react';
// 1. FIXED IMPORT PATH
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const Header = () => {
  // 2. FIXED FUNCTION NAME (logout instead of logoutUser)
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <header className="flex items-center justify-between py-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-500/10 rounded-xl rounded-tr-sm">
          <HeartPulse className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent m-0">
            Smart Doctor Assistant
          </h1>
          <p className="text-sm text-slate-500">Secured MCP Powered AI Agent</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 bg-dark-800 border border-dark-600/50 p-1.5 pl-3 rounded-full">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-slate-200">{user.name}</span>
              <BatchType role={user.role} />
            </div>
            
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white shadow-inner">
              {getInitials(user.name)}
            </div>

            <button
              onClick={logout} // 3. UPDATED ONCLICK
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-red-400 hover:bg-dark-700 transition-colors ml-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

const BatchType = ({ role }) => {
  if (role === 'doctor') return <Badge variant="success" className="text-[10px] scale-90 origin-right">Doctor</Badge>;
  return <Badge variant="default" className="text-[10px] scale-90 origin-right">Patient</Badge>;
};