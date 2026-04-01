import React from 'react';
import { DoctorSchedule } from './DoctorSchedule';
import { motion } from 'framer-motion';
import { Calendar, Users, Activity, Clock, ChevronRight, InboxIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useApp } from '../../context/AppContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0 }
};

const EmptyState = ({ message, desc }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mb-4">
      <InboxIcon className="w-8 h-8 text-slate-500" />
    </div>
    <p className="text-slate-300 font-medium">{message}</p>
    <p className="text-slate-500 text-sm mt-1">{desc}</p>
  </div>
);

const AppointmentItem = ({ title, subtitle, time, status, isDoctorView = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-dark-900/50 p-4 rounded-xl border border-dark-600/50 hover:bg-dark-800 transition-colors gap-4">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-primary-500/20 rounded-full text-primary-400">
        <Calendar className="w-5 h-5" />
      </div>
      <div>
        <p className="font-medium text-slate-200">{title}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
    <div className="sm:text-right flex items-center sm:block gap-4">
      <p className="text-sm font-semibold text-primary-400">
        {new Date(time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
      <p className="text-xs text-slate-500">
        {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
      <Badge variant={status === 'SCHEDULED' ? 'outline' : 'success'} className="ml-2 sm:ml-0 sm:mt-1 hidden sm:inline-flex">
        {status}
      </Badge>
    </div>
  </div>
);

const PatientDashboard = ({ user, data }) => {
  const upcoming = data?.upcoming || [];
  const history = data?.history || [];
  
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-xl font-semibold text-slate-100">Welcome, {user?.name.split(' ')[0]}</h2>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-primary-600/10 to-indigo-900/20 border-primary-500/20">
          <CardHeader>
            <CardTitle className="text-primary-300">Your Appointments</CardTitle>
            <CardDescription>Keep track of your schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && history.length === 0 ? (
              <EmptyState 
                message="No appointments booked yet" 
                desc="Ask the Smart Assistant to schedule one for you." 
              />
            ) : (
              <>
                {upcoming.map((apt) => (
                  <AppointmentItem 
                    key={apt.id}
                    title={`${apt.doctor?.name || 'Doctor'}`}
                    subtitle={apt.doctor?.specialization || 'Appointment'}
                    time={apt.time}
                    status={apt.status}
                  />
                ))}
                {history.length > 0 && (
                  <div className="pt-4">
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">History</p>
                    <div className="space-y-3">
                      {history.map((apt) => (
                        <AppointmentItem 
                          key={apt.id}
                          title={`${apt.doctor?.name || 'Doctor'}`}
                          subtitle={apt.doctor?.specialization || 'Appointment'}
                          time={apt.time}
                          status={apt.status}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const DoctorDashboard = ({ data }) => {
  const stats = data?.stats || { today_patients: 0, success_rate: '0%' };
  const todaySchedule = data?.today_schedule || [];
  const appointments = data?.appointments || [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-xl font-semibold text-slate-100">Live Analytics</h2>
        <Badge variant="success" className="animate-pulse">Live</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="p-4">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Today's Patients</span>
            </div>
            <p className="text-3xl font-bold text-slate-100">{stats.today_patients}</p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-4">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Success Rate</span>
            </div>
            <p className="text-3xl font-bold text-slate-100">{stats.success_rate}</p>
          </Card>
        </motion.div>
      </div>

      <DoctorSchedule />

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Your upcoming patient visits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {todaySchedule.length === 0 ? (
              <EmptyState 
                message="Your schedule is clear" 
                desc="No patients booked for this timeframe." 
              />
            ) : (
              todaySchedule.map((apt) => (
                <div key={apt.id} className="group flex items-center justify-between py-4 border-b border-dark-600/30 last:border-0 hover:bg-dark-700/50 px-2 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-primary-400 w-16 whitespace-nowrap">
                      {new Date(apt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{apt.patient?.name || 'Patient'}</p>
                      <p className="text-xs text-slate-500">{new Date(apt.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export const Dashboard = () => {
  const { user, dashboardData } = useApp();

  if (!dashboardData) {
    return (
      <div className="w-full flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  return user?.role === 'doctor' 
    ? <DoctorDashboard data={dashboardData} /> 
    : <PatientDashboard user={user} data={dashboardData} />;
};
