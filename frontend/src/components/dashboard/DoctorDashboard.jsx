import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, Sparkles, Calendar as CalendarIcon, LayoutDashboard, UserPlus, CreditCard, User, Settings, LogOut, FileText, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
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
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'profile' | 'payment' | 'settings'

  // --- Global Data & Hooks ---
  const stats = data?.stats || {};
  const allAppointments = data?.appointments || []; 
  const { handleSendMessage } = useApp(); 
  const { user, logout } = useAuth(); 

  // --- Settings/Profile State ---
  const [bio, setBio] = useState('General Practitioner with 10+ years of experience. Specializing in preventative medicine and routine checkups.');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Dynamic Dashboard Logic ---
  const futureAppointments = allAppointments.filter(appt => {
    const appointmentDate = new Date(appt.time);
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    return appointmentDate >= now;
  }).sort((a, b) => new Date(a.time) - new Date(b.time));

  const nextPatient = futureAppointments.length > 0 ? futureAppointments[0] : null;

  const totalPatients = stats.total_patients || 0;
  const todayAppointmentsCount = futureAppointments.length;

  const reviewData = data?.reviews || { excellent: 142, great: 45, good: 12, average: 4 };
  const totalReviews = Object.values(reviewData).reduce((a, b) => a + b, 0) || 1;

  // Calendar Logic
  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const prevMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  
  const calendarGrid = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) calendarGrid.push({ date: prevMonthDays - i, isCurrentMonth: false });
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push({ date: i, isCurrentMonth: true, isToday: i === today.getDate() });
  const remainingCells = 35 - calendarGrid.length; 
  for (let i = 1; i <= remainingCells; i++) calendarGrid.push({ date: i, isCurrentMonth: false });

  // --- Actions ---
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

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    toast('Asking AI to generate report...', { icon: '🤖' });
    try {
      await handleSendMessage("Give me a summary report of my patients.");
    } catch (error) {
      toast.error("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper for dynamic header title
  const getHeaderTitle = () => {
    switch(activeView) {
      case 'dashboard': return 'Dashboard Overview';
      case 'profile': return 'Doctor Profile';
      case 'payment': return 'Payments & Billing';
      case 'settings': return 'System Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen bg-[#F5F6FA] dark:bg-slate-950">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/50 border-4 border-blue-500 shadow-sm flex items-center justify-center overflow-hidden mb-4 p-1">
             <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
               <User size={40} className="text-slate-400 dark:text-slate-500" />
             </div>
          </div>
          <h3 className="font-bold text-blue-600 dark:text-blue-400 text-lg">{user?.name || 'Dr. Arun Prasad'}</h3>
          <p className="text-[10px] text-blue-500/70 font-semibold uppercase tracking-wider text-center mt-1">MBBS, FCPS - MD (Medicine)</p>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem icon={<CreditCard size={18} />} label="Payment" isActive={activeView === 'payment'} onClick={() => setActiveView('payment')} />
          <NavItem icon={<User size={18} />} label="Profile" isActive={activeView === 'profile'} onClick={() => setActiveView('profile')} />
          <NavItem icon={<Settings size={18} />} label="Settings" isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </nav>

        <div className="p-4 mb-4">
          <button onClick={logout} className="flex items-center gap-4 w-full px-8 py-3 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors font-medium text-sm">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* Dynamic Header */}
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
             {getHeaderTitle()}
           </h2>
           {activeView === 'dashboard' && (
             <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 pr-4 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
               <Button onClick={handleGenerateSummary} isLoading={isGenerating} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                 {!isGenerating && <Sparkles size={16} className="mr-2" />}
                 AI Summary
               </Button>
             </div>
           )}
        </div>

        <AnimatePresence mode="wait">
          
          {/* ================= DASHBOARD VIEW ================= */}
          {activeView === 'dashboard' && (
            <motion.div key="dashboard" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN (2/3 Width): Stats, Appointments, Reviews */}
              <div className="xl:col-span-2 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard title="Total Patients" value={totalPatients.toString()} subtext="Till Today" icon={<Users />} />
                  <StatCard title="Today's Appointments" value={todayAppointmentsCount.toString().padStart(3, '0')} subtext={new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} icon={<Activity />} />
                </div>

                {/* Today's Appointment Feed */}
                <motion.div variants={itemVariants}>
                  <Card className="p-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col min-h-[350px]">
                    <div className="p-5 flex justify-between items-center">
                      <h3 className="text-[15px] font-semibold text-blue-600 dark:text-blue-400">Today's Appointments</h3>
                      <button className="text-blue-600 text-sm font-semibold hover:underline">See All</button>
                    </div>
                    <div className="grid grid-cols-3 px-5 pb-3 text-xs font-semibold text-slate-500">
                      <div>Patient</div>
                      <div>Name/Diagnosis</div>
                      <div className="text-right">Time</div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50 flex-1 overflow-y-auto">
                      {futureAppointments.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">No upcoming appointments.</div>
                      ) : (
                        futureAppointments.map((apt) => (
                          <div key={apt.id} className="p-4 px-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 shrink-0">
                                 {apt.patient?.name?.charAt(0) || apt.patient_name?.charAt(0) || 'P'}
                              </div>
                              <div>
                                <p className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                                  {apt.patient?.name || apt.patient_name || 'Patient Name'}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Health Checkup</p>
                              </div>
                            </div>
                            <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[11px] font-bold">
                              {new Date(apt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </motion.div>

                {/* Patient Reviews Card */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 mb-6">Patient Reviews Breakdown</h3>
                    <div className="space-y-4">
                       <ReviewBar label="Excellent" count={reviewData.excellent} total={totalReviews} color="bg-blue-600" />
                       <ReviewBar label="Great" count={reviewData.great} total={totalReviews} color="bg-emerald-500" />
                       <ReviewBar label="Good" count={reviewData.good} total={totalReviews} color="bg-orange-400" />
                       <ReviewBar label="Average" count={reviewData.average} total={totalReviews} color="bg-cyan-400" />
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* RIGHT COLUMN (1/3 Width): Calendar, Next Patient */}
              <div className="xl:col-span-1 space-y-6">
                {/* Dynamic Calendar */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-[15px] font-semibold text-blue-600">Calendar</h3>
                       <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                          <ChevronLeft size={16} className="cursor-pointer opacity-50" />
                          {currentMonthName}
                          <ChevronRight size={16} className="cursor-pointer opacity-50" />
                       </div>
                    </div>
                    <div className="grid grid-cols-7 text-center gap-y-4">
                       {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                         <div key={day} className="text-xs font-bold text-slate-800 dark:text-slate-200">{day}</div>
                       ))}
                       {calendarGrid.map((cell, i) => (
                         <div key={i} className={`text-sm flex items-center justify-center h-8 w-8 mx-auto rounded-full 
                           ${!cell.isCurrentMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300'} 
                           ${cell.isToday ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30' : 'font-medium'}`}>
                           {cell.date}
                         </div>
                       ))}
                    </div>
                  </Card>
                </motion.div>

                {/* Next Patient Details */}
                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-slate-200 dark:border-slate-800 bg-blue-50/30 dark:bg-slate-900/80 shadow-sm relative overflow-hidden">
                    <h3 className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 mb-6">Next Patient Details</h3>
                    {nextPatient ? (
                      <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 shrink-0">
                              {nextPatient.patient?.name?.charAt(0) || nextPatient.patient_name?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                                {nextPatient.patient?.name || nextPatient.patient_name || 'Patient'}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Health Checkup</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Scheduled For</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {new Date(nextPatient.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Status</p>
                            <p className="font-bold text-amber-600 dark:text-amber-400">{nextPatient.status}</p>
                          </div>
                        </div>
                        <div className="pt-2 flex gap-2">
                          <Button size="sm" className="flex-1 text-[11px] bg-blue-600 hover:bg-blue-700">Check-In</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-500 dark:text-slate-400">No patients waiting.</div>
                    )}
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ================= PROFILE VIEW ================= */}
          {activeView === 'profile' && (
             <motion.div key="profile" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
               
               {/* Left Column: Profile Overview Card */}
               <motion.div variants={itemVariants} className="xl:col-span-1">
                 <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full bg-blue-50 dark:bg-blue-900/50 border-4 border-blue-500 shadow-sm flex items-center justify-center overflow-hidden mb-4">
                       <User size={64} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">{user?.name || 'Dr. Arun Prasad'}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">General Practitioner</p>
                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-6"></div>
                    <div className="w-full space-y-3 text-sm text-left">
                       <div className="flex justify-between">
                         <span className="text-slate-500 dark:text-slate-400">Experience</span>
                         <span className="font-semibold text-slate-800 dark:text-slate-200">10+ Years</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-500 dark:text-slate-400">Location</span>
                         <span className="font-semibold text-slate-800 dark:text-slate-200">New York, NY</span>
                       </div>
                    </div>
                 </Card>
               </motion.div>

               {/* Right Column: Bio Editor */}
               <motion.div variants={itemVariants} className="xl:col-span-2">
                 <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col h-full min-h-[400px]">
                   <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Professional Biography</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This information will be displayed to patients when they view your profile or book an appointment.</p>
                   
                   <textarea
                     value={bio}
                     onChange={(e) => setBio(e.target.value)}
                     className="w-full flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm leading-relaxed"
                     placeholder="Write your professional bio here..."
                   />
                   <div className="flex justify-end mt-4">
                     <Button isLoading={isSavingBio} onClick={handleSaveBio} className="bg-blue-600 hover:bg-blue-700">Save Biography</Button>
                   </div>
                 </Card>
               </motion.div>
             </motion.div>
          )}

          {/* ================= PAYMENT PROTOTYPE VIEW ================= */}
          {activeView === 'payment' && (
             <motion.div key="payment" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-7xl mx-auto space-y-6">
                
                {/* Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard title="Total Earnings" value="$12,450.00" subtext="This Month" icon={<CreditCard />} />
                  <StatCard title="Pending Payout" value="$3,200.00" subtext="Processing..." icon={<Activity />} />
                  
                  {/* Action Card */}
                  <motion.div variants={itemVariants}>
                    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-blue-600 shadow-sm flex flex-col justify-center items-center text-white h-full group cursor-pointer hover:bg-blue-700 transition-colors">
                       <h3 className="font-semibold text-lg mb-1">Withdraw Funds</h3>
                       <p className="text-blue-200 text-sm flex items-center gap-2">Manage Bank Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></p>
                    </Card>
                  </motion.div>
                </div>

                {/* Dummy Transaction Table */}
                <motion.div variants={itemVariants}>
                  <Card className="p-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Transactions</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500">
                          <tr>
                            <th className="px-6 py-4">Transaction ID</th>
                            <th className="px-6 py-4">Patient</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {/* Dummy Rows */}
                          {[1, 2, 3, 4, 5].map((item) => (
                            <tr key={item} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">#TRX-00{item}9X</td>
                              <td className="px-6 py-4">Patient Name {item}</td>
                              <td className="px-6 py-4">April {item + 3}, 2026</td>
                              <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">$150.00</td>
                              <td className="px-6 py-4 text-right">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 size={12} /> Completed
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
             </motion.div>
          )}

          {/* ================= SETTINGS VIEW ================= */}
          {activeView === 'settings' && (
             <motion.div key="settings" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-3xl mx-auto">
               <motion.div variants={itemVariants}>
                  <DoctorSchedule />
               </motion.div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

// --- Helper Components ---

const NavItem = ({ icon, label, isActive, onClick }) => (
  <div className="px-4">
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-3.5 transition-all font-semibold text-sm rounded-r-full ${
      isActive 
        ? 'text-blue-600 border-l-4 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
        : 'text-slate-500 hover:text-blue-500 border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
    }`}>
      {icon} 
      <span>{label}</span>
    </button>
  </div>
);

const StatCard = ({ title, value, subtext, icon }) => (
  <motion.div variants={itemVariants} className="h-full">
    <Card className="h-full p-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-5">
      <div className="w-16 h-16 rounded-full border-2 border-blue-600 flex items-center justify-center text-blue-600 shrink-0">
         <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
            {icon}
         </div>
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</h3>
        <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      </div>
    </Card>
  </motion.div>
);

const ReviewBar = ({ label, count, total, color }) => {
  const percent = Math.round((count / total) * 100) || 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-16 text-xs font-medium text-slate-500">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }} />
      </div>
      <span className="w-8 text-right text-[10px] font-bold text-slate-400">{percent}%</span>
    </div>
  );
};