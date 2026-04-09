import React from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorDashboard } from './DoctorDashboard';
import { PatientDashboard } from './PatientDashboard';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const { dashboardData } = useApp();

  if (!dashboardData) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-20 gap-4 text-slate-400 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500"/>
        <p>Loading your secure dashboard...</p>
      </div>
    );
  }

  return user?.role === 'doctor' 
    ? <DoctorDashboard data={dashboardData} /> 
    : <PatientDashboard user={user} data={dashboardData} />;
};