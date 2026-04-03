import React from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorDashboard } from './DoctorDashboard';
import { PatientDashboard } from './PatientDashboard';
import { Loader2 } from 'lucide-react';

export const Dashboard = () => {
  const { user, dashboardData } = useApp();

  if (!dashboardData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-20 gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500"/>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return user?.role === 'doctor' 
    ? <DoctorDashboard data={dashboardData} /> 
    : <PatientDashboard user={user} data={dashboardData} />;
};
