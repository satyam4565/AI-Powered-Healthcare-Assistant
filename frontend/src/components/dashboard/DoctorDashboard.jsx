import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Sparkles } from 'lucide-react'; // Added Sparkles icon
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { DoctorSchedule } from './DoctorSchedule';
import toast from 'react-hot-toast';
import { updateDoctorProfile } from '../../services/api';
import { useApp } from '../../context/AppContext'; // Imported to use the chat function

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const DoctorDashboard = ({ data }) => {
  const stats = data?.stats || { today_patients: 0, success_rate: '0%' };
  const allAppointments = data?.appointments || []; // Using all appointments instead of just today's
  const { handleSendMessage } = useApp(); // Pulling in the invisible chat function

  const [bio, setBio] = useState('General Practitioner with 10+ years of experience.');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // State for the AI button

  // --- LOGIC: Filter for Future Appointments ---
  const futureAppointments = allAppointments.filter(appt => {
    const appointmentDate = new Date(appt.time);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    return appointmentDate >= now;
  });

  // Sort them chronologically
  futureAppointments.sort((a, b) => new Date(a.time) - new Date(b.time));

  // --- LOGIC: Handle Saving Bio ---
  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      await updateDoctorProfile(bio);
      toast.success('Bio updated successfully!');
    } catch (err) {
      toast.error('Failed to update bio');
    } finally {
      setIsSavingBio(false);
    }
  };

  // --- LOGIC: Trigger Invisible LLM Tool ---
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    toast('Asking AI to generate report...', { icon: '🤖' });
    try {
      // This silently sends the message to your FastAPI backend
      // The backend calls the LLM, the LLM calls the tool, and the backend returns the ||REPORT|| string
      // Your AppContext will catch the ||REPORT|| string and trigger the final toast notification!
      await handleSendMessage("Give me a summary report of my patients.");
    } catch (error) {
      toast.error("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between mt-2">
        <h2 className="text-2xl font-bold text-white">Command Center</h2>
        <div className="flex items-center gap-4">
          {/* NEW: AI Summary Button */}
          <Button
            onClick={handleGenerateSummary}
            isLoading={isGenerating}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
          >
            {!isGenerating && <Sparkles size={16} />}
            Generate AI Summary
          </Button>

          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="p-6 bg-indigo-900/10 border-indigo-500/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Today's Patients</p>
                <h3 className="text-4xl font-bold text-white">{stats.today_patients}</h3>
              </div>
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Users size={24} />
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="p-6 bg-purple-900/10 border-purple-500/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Success Rate</p>
                <h3 className="text-4xl font-bold text-white">{stats.success_rate}</h3>
              </div>
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                <Activity size={24} />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule + Bio */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants}>
            <DoctorSchedule />
          </motion.div>

          {/* Bio Editor */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Doctor Bio</h3>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none"
                placeholder="Write your professional bio here..."
              />
              <div className="flex justify-end mt-4">
                <Button isLoading={isSavingBio} onClick={handleSaveBio}>
                  Save Bio
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Upcoming Appointments Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="p-6 h-full border-slate-700/50 bg-slate-800/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" />
              Upcoming Appointments
            </h3>
            <div className="space-y-3">
              {futureAppointments.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className="text-slate-400 text-sm">No upcoming appointments scheduled.</p>
                </div>
              ) : (
                futureAppointments.map((apt) => (
                  <div key={apt.id} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 transition-all hover:bg-slate-800/80 hover:border-indigo-500/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-100">{apt.patient?.name || apt.patient_name || 'Patient'}</p>
                        <p className="text-xs text-indigo-400 mt-0.5">
                          {/* UPDATED: Now shows both Date and Time */}
                          {new Date(apt.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} @ {new Date(apt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                        {apt.status}
                      </span>
                    </div>
                    {apt.status === 'SCHEDULED' && (
                      <Button size="sm" className="w-full mt-2" variant="secondary" onClick={() => toast.success(`Checked in ${apt.patient?.name || apt.patient_name}`)}>
                        Check-in
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};