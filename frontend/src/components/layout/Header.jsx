import React from 'react';
import { User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../ui/Badge';

export const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <header className="flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="h-12 flex items-center">
          <img
            src="/logo.png"
            alt="MediBridge Logo"
            className="h-full w-auto max-w-[180px] object-contain"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-slate-200 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-dark-700 transition"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {user && (
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-600/50 p-1.5 pl-3 rounded-full">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.name}</span>
              <BatchType role={user.role} />
            </div>

            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white shadow-inner">
              {getInitials(user.name)}
            </div>

            <button
              onClick={logout}
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors ml-1"
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