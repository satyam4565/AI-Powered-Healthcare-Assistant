import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Activity, Sparkles, Calendar as CalendarIcon, LayoutDashboard, 
  Settings, LogOut, ChevronLeft, ChevronRight, FileText, Bot, Search, Filter, 
  FileSearch, CalendarCheck, Bell, User, Camera, Mail, CheckCircle2, Clock
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { DoctorSchedule } from './DoctorSchedule';
import toast from 'react-hot-toast';
import { updateDoctorProfile } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const DoctorDashboard = ({ data }) => {
  // --- View State ---
  const [activeView, setActiveView] = useState('dashboard');

  // --- Global Data & Hooks ---
  const stats = data?.stats || {};
  const allAppointments = data?.appointments || [];
  const { handleSendMessage } = useApp();
  const { user, logout, updateUser } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Profile / Settings State ---
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [bio, setBio] = useState(user?.bio || '');
  const [specialization, setSpecialization] = useState(user?.specialization || 'General Practitioner');
  const [experience, setExperience] = useState(user?.experience || '');
  const [location, setLocation] = useState(user?.location || '');
  const [isSavingBio, setIsSavingBio] = useState(false);

  // --- Calendar State ---
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  const currentMonthName = new Date(calendarYear, calendarMonth, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

  const isViewingCurrentMonth =
    calendarYear === today.getFullYear() && calendarMonth === today.getMonth();

  const calendarGrid = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--)
    calendarGrid.push({ date: prevMonthDays - i, isCurrentMonth: false });
  for (let i = 1; i <= daysInMonth; i++)
    calendarGrid.push({
      date: i,
      isCurrentMonth: true,
      isToday: isViewingCurrentMonth && i === today.getDate(),
    });
  const remainingCells = 35 - calendarGrid.length;
  for (let i = 1; i <= remainingCells; i++)
    calendarGrid.push({ date: i, isCurrentMonth: false });

  // --- Data Processing (Realtime Filtering) ---
  
  // Separate appointments into past and future
  const { pastAppointments, futureAppointments } = useMemo(() => {
    const now = new Date();
    const past = [];
    const future = [];
    
    allAppointments.forEach(appt => {
      const apptDate = new Date(appt.time);
      if (apptDate >= now) {
        future.push(appt);
      } else {
        past.push(appt);
      }
    });
    
    // Sort future appointments closest first
    future.sort((a, b) => new Date(a.time) - new Date(b.time));
    // Sort past appointments most recent first
    past.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    return { pastAppointments: past, futureAppointments: future };
  }, [allAppointments]);

  // Determine Next Patient
  const nextPatient = futureAppointments.length > 0 ? futureAppointments[0] : null;
  
  // Count appointments specifically for today
  const todayAppointmentsCount = useMemo(() => {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return allAppointments.filter(appt => {
      const d = new Date(appt.time);
      return d >= startOfToday && d <= endOfToday;
    }).length;
  }, [allAppointments, today]);

  // Transform recent appointments into table data format
  const recentPatientsData = useMemo(() => {
    // Combine some future and some past to simulate a lively queue, or just show the upcoming schedule
    const displayList = futureAppointments.slice(0, 5); 
    
    return displayList.map((apt, index) => {
      const apptDate = new Date(apt.time);
      const isToday = apptDate.toDateString() === today.toDateString();
      const dateString = isToday ? 'Today' : apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      // Attempt to extract patient name, fallback to generic
      const pName = apt.patient?.name || apt.patient_name || `Patient ${index + 1}`;
      const initials = pName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PT';
      
      // Determine status badge styling based on API status
      let statusColor = 'slate';
      let displayStatus = (apt.status || 'SCHEDULED').toUpperCase();
      
      if (displayStatus === 'CONFIRMED' || displayStatus === 'SCHEDULED') statusColor = 'emerald';
      if (displayStatus === 'URGENT') statusColor = 'red';
      if (displayStatus === 'PENDING') statusColor = 'amber';
      if (displayStatus === 'CANCELLED') statusColor = 'slate';

      return {
        id: apt.id || `#MB-${Math.floor(1000 + Math.random() * 9000)}`,
        name: pName,
        initials,
        demo: 'General Checkup', // Replace if API provides demographic/reason data
        date: dateString,
        time: apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: displayStatus,
        color: statusColor,
        raw: apt
      };
    });
  }, [futureAppointments, today]);

  // --- Actions ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingBio(true);
    try {
      await updateDoctorProfile({ bio, specialization, experience, location, profileImage });
      updateUser({ ...user, bio, specialization, experience, location, profileImage });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    toast('Asking AI to generate report...', { icon: '🤖' });
    try {
      await handleSendMessage('Give me a summary report of my patients.');
      toast.success('Summary generated successfully!');
    } catch (error) {
      toast.error('Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Display Formatting ---
  const headerDateString = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const doctorLastName = user?.name ? user.name.split(' ').pop() : 'Prasad';

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0">
        
        {/* Brand Logo - Fixed Alignment */}
        <div className="p-8 pb-6 flex items-center gap-3">
          <img src="/logo.png" alt="MediBridge Logo" className="h-14 sm:h-16 w-auto object-contain" />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem icon={<Clock size={18} />}           label="Payments" isActive={activeView === 'payments'} onClick={() => setActiveView('payments')} />
          <NavItem icon={<Clock size={18} />}           label="Weekly Schedule" isActive={activeView === 'schedule'} onClick={() => setActiveView('schedule')} />
          <NavItem icon={<Settings size={18} />}        label="Settings" isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </div>

        {/* Bottom Profile */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
               {profileImage || user?.profileImage ? (
                  <img src={profileImage || user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-blue-600" />
                )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 line-clamp-1">Dr. {doctorLastName}</p>
              <p className="text-[11px] font-medium text-slate-500 line-clamp-1">{specialization || 'General Practitioner'}</p>
            </div>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8 md:p-10 pb-24">
          
          <AnimatePresence mode="wait">
            
            {/* ================= DASHBOARD VIEW ================= */}
            {activeView === 'dashboard' && (
              <motion.div key="dashboard" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-[1200px] mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                  <div>
                    <h2 className="text-[32px] font-bold text-slate-900 tracking-tight mb-2">Daily Overview</h2>
                    <p className="text-[15px] font-medium text-slate-500">
                      {headerDateString} — Good morning, Dr. {doctorLastName}.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      className="bg-[#b3f0dd] hover:bg-[#9de3cc] text-[#0f5c43] font-semibold rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Activity size={18} />
                      Start Consultation
                    </Button>
                    <Button 
                      onClick={handleGenerateSummary} 
                      isLoading={isGenerating}
                      className="bg-[#2b5aee] hover:bg-[#234bd6] text-white font-semibold rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
                    >
                      {!isGenerating && <Sparkles size={18} />}
                      AI Summary
                    </Button>
                  </div>
                </div>

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Pending Reports Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FileSearch size={20} strokeWidth={2.5} />
                        </div>
                        <span className="px-2.5 py-1 bg-red-100 text-red-600 text-[11px] font-bold rounded-md">High Priority</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">Pending Reports</p>
                      <h3 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
                        {stats.pending_reports || '12'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center"><Activity size={8} /></div>
                        Avg. turnaround: 4.2 hrs
                      </div>
                    </Card>
                  </motion.div>

                  {/* Appointments Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CalendarCheck size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md uppercase tracking-wider">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          Live Session
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">Today's Appointments</p>
                      <h3 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
                        {todayAppointmentsCount.toString().padStart(2, '0')}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <User size={12} />
                        Next: {nextPatient ? `${nextPatient.patient?.name || nextPatient.patient_name || 'Patient'} (${new Date(nextPatient.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : 'None'}
                      </div>
                    </Card>
                  </motion.div>

                  {/* Notifications Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="p-6 bg-white border border-slate-100 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                          <Bell size={20} strokeWidth={2.5} />
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1">Patient Notifications</p>
                      <h3 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
                        {stats.unread_messages || '24'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center"><FileText size={8} /></div>
                        {stats.unread_messages || '6'} unread messages
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Bottom Section (Table + Calendar) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Recent/Upcoming Patients Table */}
                  <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-0 overflow-hidden h-full min-h-[400px]">
                      <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-50">
                        <h3 className="text-[18px] font-bold text-slate-900">Upcoming Patients</h3>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Search registry..." 
                              className="bg-slate-100/70 border-none rounded-lg pl-9 pr-4 py-2 text-[13px] font-medium w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 transition-all"
                            />
                          </div>
                          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600">
                            <Filter size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Patient Name</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Case ID</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Schedule</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase">Status</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 tracking-widest uppercase text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {recentPatientsData.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium text-sm">
                                  No upcoming patients found.
                                </td>
                              </tr>
                            ) : (
                              recentPatientsData.map((patient, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-9 h-9 rounded-full bg-${patient.color}-100 text-${patient.color}-700 flex items-center justify-center font-bold text-[11px]`}>
                                        {patient.initials}
                                      </div>
                                      <div>
                                        <p className="text-[13px] font-bold text-slate-900">{patient.name}</p>
                                        <p className="text-[11px] font-medium text-slate-400">{patient.demo}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-[12px] font-semibold text-slate-500">{patient.id}</td>
                                  <td className="px-6 py-4">
                                    <p className="text-[12px] font-semibold text-slate-900">{patient.date}</p>
                                    <p className="text-[11px] font-medium text-slate-400">{patient.time}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                                      ${patient.color === 'red' ? 'bg-red-100 text-red-600' : 
                                        patient.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 
                                        patient.color === 'amber' ? 'bg-amber-100 text-amber-600' : 
                                        'bg-slate-100 text-slate-600'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full bg-${patient.color}-500`}></div>
                                      {patient.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button className="text-[12px] font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                      View File
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Calendar Widget */}
                  <motion.div variants={itemVariants} className="lg:col-span-1">
                    <Card className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-6 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[15px] font-bold text-slate-900">Schedule</h3>
                        <div className="flex items-center gap-1 text-slate-600">
                          <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-md transition-colors"><ChevronLeft size={16} /></button>
                          <span className="text-[13px] font-bold min-w-[100px] text-center">{currentMonthName}</span>
                          <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-md transition-colors"><ChevronRight size={16} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 text-center gap-y-4 flex-1 content-start">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <div key={day} className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">{day}</div>
                        ))}
                        {calendarGrid.map((cell, i) => (
                          <div key={i} className={`text-[13px] flex items-center justify-center h-8 w-8 mx-auto rounded-full
                            ${!cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                            ${cell.isToday ? 'bg-[#2b5aee] text-white font-bold shadow-md shadow-blue-500/20' : 'font-medium hover:bg-slate-50 cursor-pointer transition-colors'}`}>
                            {cell.date}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>

                </div>
              </motion.div>
            )}

            {/* ================= SCHEDULE VIEW ================= */}
            {activeView === 'schedule' && (
              <motion.div key="schedule" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-[800px] mx-auto h-[70vh]">
                <div className="mb-8">
                   <h2 className="text-[28px] font-bold text-slate-900 tracking-tight mb-2">Availability Settings</h2>
                   <p className="text-[15px] font-medium text-slate-500">Configure your standard working hours for patient booking.</p>
                </div>
                <motion.div variants={itemVariants} className="h-full">
                  <DoctorSchedule />
                </motion.div>
              </motion.div>
            )}

            {/* ================= SETTINGS (PROFILE) VIEW ================= */}
            {activeView === 'settings' && (
              <motion.div key="settings" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-[800px] mx-auto">
                 <div className="mb-8">
                   <h2 className="text-[28px] font-bold text-slate-900 tracking-tight mb-2">Doctor Profile</h2>
                   <p className="text-[15px] font-medium text-slate-500">Manage your public information and clinical details.</p>
                </div>

                <motion.div variants={itemVariants}>
                  <Card className="p-8 bg-white border border-slate-100 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
                    
                    {/* Top Row: Avatar & Basic Info */}
                    <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
                      
                      {/* Avatar Upload */}
                      <div className="relative group shrink-0">
                        <div className="w-28 h-28 rounded-full bg-blue-50 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                          {profileImage || user?.profileImage ? (
                            <img src={profileImage || user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User size={48} className="text-blue-300" />
                          )}
                        </div>
                        <label className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera size={24} className="text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>

                      {/* Read-only Data (Name/Email) */}
                      <div className="flex-1 space-y-4 pt-2">
                        <div>
                           <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1.5">Full Name</label>
                           <p className="text-[16px] font-bold text-slate-900">{user?.name || 'Doctor Name'}</p>
                        </div>
                        <div>
                           <label className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-1.5">Account Email</label>
                           <p className="text-[15px] font-medium text-slate-600 flex items-center gap-2">
                             <Mail size={16} className="text-slate-400"/> {user?.email || 'doctor@medibridge.com'}
                           </p>
                        </div>
                      </div>
                    </div>

                    {/* Editable Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                       <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          placeholder="e.g. Cardiologist"
                          className="w-full bg-[#f4f5f7] border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl h-[46px] px-4 text-[15px] font-medium transition-all outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Years of Experience
                        </label>
                        <input
                          type="text"
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="e.g. 10+ Years"
                          className="w-full bg-[#f4f5f7] border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl h-[46px] px-4 text-[15px] font-medium transition-all outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Clinic Location
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. New York, NY"
                          className="w-full bg-[#f4f5f7] border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl h-[46px] px-4 text-[15px] font-medium transition-all outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Professional Biography
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Write a brief professional bio..."
                          className="w-full bg-[#f4f5f7] border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl p-4 text-[15px] font-medium transition-all outline-none resize-none h-32"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 mt-8">
                       <Button 
                        onClick={handleSaveProfile}
                        isLoading={isSavingBio}
                        className="bg-[#2b5aee] hover:bg-[#234bd6] text-white font-semibold rounded-xl px-8 py-2.5 shadow-sm shadow-blue-500/20"
                      >
                        Save Profile Changes
                      </Button>
                    </div>

                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* Fallback for undeveloped views */}
            {['appointments', 'records'].includes(activeView) && (
              <motion.div key="other" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <FileSearch size={48} className="mb-4 text-slate-300" strokeWidth={1} />
                <h3 className="text-xl font-bold text-slate-800 mb-2">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h3>
                <p className="font-medium text-slate-500">This view is currently under construction.</p>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>

        {/* Global Footer */}
        <div className="absolute bottom-0 left-0 w-full px-10 py-6 flex flex-col md:flex-row justify-between items-center bg-transparent pointer-events-none z-10 bg-gradient-to-t from-[#F8FAFC] to-transparent pt-12">
          <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase pointer-events-auto">
            © 2026 MEDIBRIDGE. THE ETHEREAL CLINIC FRAMEWORK.
          </div>
          <div className="flex gap-6 text-[10px] font-bold tracking-widest text-slate-400 uppercase pointer-events-auto">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Legal</a>
          </div>
        </div>

      </main>
    </div>
  );
};

// --- Helper Components ---
const NavItem = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-semibold text-[13.5px] ${
      isActive
        ? 'bg-[#f4f7fb] text-[#2b5aee]'
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);