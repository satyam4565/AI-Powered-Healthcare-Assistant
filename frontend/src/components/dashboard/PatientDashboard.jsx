import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Card } from '../ui/Card';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export const PatientDashboard = ({ user, data }) => {
  const upcoming = data?.upcoming || [];
  const history = data?.history || [];
  
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-4 h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Welcome, {user?.name.split(' ')[0]}!</h2>
        <p className="text-slate-400 text-sm">Here's your medical overview.</p>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="p-5 border-indigo-500/20 bg-indigo-900/10 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Calendar size={64} />
          </div>
          <h3 className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-4 relative z-10">Next Appointment</h3>
          {upcoming.length > 0 ? (
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white mb-1">
                {new Date(upcoming[0].time).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-indigo-200">
                {new Date(upcoming[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with {upcoming[0].doctor?.name}
              </p>
              <span className="inline-block mt-3 text-xs uppercase tracking-wider font-bold px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                {upcoming[0].status}
              </span>
            </div>
          ) : (
            <p className="text-slate-400 text-sm relative z-10">No upcoming appointments.</p>
          )}
        </Card>
      </motion.div>

      {history.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Past Visits</h3>
          <div className="space-y-3">
            {history.map((apt) => (
              <div key={apt.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <p className="font-semibold text-slate-200">{apt.doctor?.name || 'Doctor'}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-400">
                    {new Date(apt.time).toLocaleDateString()}
                  </p>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
