import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  LayoutDashboard, 
  User, 
  Settings, 
  LogOut, 
  FileText, 
  Activity, 
  Heart, 
  Thermometer, 
  Sparkles,
  Pill,
  ChevronRight,
  MessageSquare,
  CalendarPlus
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ChatContainer } from '../chat/ChatContainer'; 

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const PatientDashboard = ({ user, data }) => {
  // --- View & Input State ---
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'records' | 'profile' | 'settings' | 'assistant'
  const [inputValue, setInputValue] = useState('');
  
  // --- Global Data & Hooks ---
  const { handleSendMessage, messages, isChatLoading, handleClearChat } = useApp(); 
  const { logout } = useAuth(); 

  const [bio, setBio] = useState('No known allergies. Currently taking prescribed medication for mild hypertension.');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- Dynamic Dashboard Logic ---
  const upcoming = data?.upcoming || [];
  const history = data?.history || [];
  const nextAppointment = upcoming.length > 0 ? upcoming[0] : null;

  const activePrescriptions = [
    { id: 1, name: 'Amoxicillin', dosage: '500mg', frequency: '2x Daily', status: 'Active' },
    { id: 2, name: 'Lisinopril', dosage: '10mg', frequency: '1x Daily', status: 'Refill Soon' }
  ];

  // --- Actions ---
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Medical profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const triggerAIAction = async (prompt) => {
    setActiveView('assistant'); 
    toast('Asking AI Assistant...', { icon: '🤖' });
    try {
      await handleSendMessage(prompt);
    } catch (error) {
      toast.error("Failed to process request.");
    }
  };

  const getHeaderTitle = () => {
    switch(activeView) {
      case 'dashboard': return 'Health Overview';
      case 'records': return 'Medical Records';
      case 'profile': return 'My Profile';
      case 'settings': return 'Account Settings';
      case 'assistant': return 'Smart AI Assistant';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen bg-[#F5F6FA] dark:bg-slate-950">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/50 border-4 border-blue-500 shadow-sm flex items-center justify-center overflow-hidden mb-4 p-1">
             <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-3xl text-slate-500 dark:text-slate-400">
               {user?.name?.charAt(0) || 'P'}
             </div>
          </div>
          <h3 className="font-bold text-blue-600 dark:text-blue-400 text-lg">{user?.name || 'Patient Name'}</h3>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-center mt-1">Patient Portal ID: #99281</p>
        </div>

        <div className="px-4 mb-2">
          <button 
            onClick={() => setActiveView('assistant')}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-md ${
              activeView === 'assistant' 
                ? 'bg-red-700 text-white shadow-red-700/30' 
                : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
            }`}
          >
            <CalendarPlus size={18} /> Book Appointment
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem icon={<FileText size={18} />} label="Medical Records" isActive={activeView === 'records'} onClick={() => setActiveView('records')} />
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
        
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
             {getHeaderTitle()}
           </h2>
        </div>

        <AnimatePresence mode="wait">
          
          {/* ================= SMART ASSISTANT VIEW ================= */}
          {activeView === 'assistant' && (
             <motion.div key="assistant" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-4xl mx-auto h-[calc(100vh-140px)]">
               <ChatContainer 
                  messages={messages}
                  isLoading={isChatLoading}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onSend={() => {
                    if (!inputValue.trim()) return;
                    handleSendMessage(inputValue);
                    setInputValue('');
                  }}
                  onClearChat={handleClearChat}
                />
             </motion.div>
          )}

          {/* ================= DASHBOARD VIEW ================= */}
          {activeView === 'dashboard' && (
            <motion.div key="dashboard" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              <div className="xl:col-span-2 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <VitalCard title="Heart Rate" value="72" unit="bpm" icon={<Heart className="text-rose-500" />} />
                  <VitalCard title="Blood Pressure" value="118/76" unit="mmHg" icon={<Activity className="text-blue-500" />} />
                  <VitalCard title="Weight" value="68" unit="kg" icon={<User className="text-emerald-500" />} />
                  <VitalCard title="Temperature" value="98.6" unit="°F" icon={<Thermometer className="text-amber-500" />} />
                </div>

                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Sparkles size={18} className="text-blue-600" /> Smart Actions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <ActionPill icon={<CalendarIcon size={14} />} label="Book Checkup" onClick={() => triggerAIAction("I want to book a general health checkup.")} />
                      <ActionPill icon={<Pill size={14} />} label="Refill Prescription" onClick={() => triggerAIAction("I need a refill for my Amoxicillin.")} />
                      <ActionPill icon={<MessageSquare size={14} />} label="Report Symptom" onClick={() => triggerAIAction("I am feeling a bit dizzy today. What should I do?")} />
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="p-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col min-h-[250px]">
                    <div className="p-5 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-[15px] font-semibold text-blue-600 dark:text-blue-400">Recent Visits</h3>
                      <button className="text-blue-600 text-sm font-semibold hover:underline" onClick={() => setActiveView('records')}>View All</button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50 flex-1 overflow-y-auto">
                      {history.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">No past visits recorded.</div>
                      ) : (
                        history.slice(0, 3).map((apt) => (
                          <div key={apt.id} className="p-4 px-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                                 <FileText size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                  {apt.doctor?.name || 'Doctor Name'}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                  {new Date(apt.time).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center text-slate-400 hover:text-blue-600 transition-colors">
                               <ChevronRight size={18} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </motion.div>
              </div>

              <div className="xl:col-span-1 space-y-6">
                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-slate-200 dark:border-slate-800 bg-blue-50/30 dark:bg-slate-900 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-900 dark:text-blue-100 pointer-events-none">
                       <CalendarIcon size={80} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-blue-600 dark:text-blue-400 mb-6">Upcoming Appointment</h3>
                    
                    {nextAppointment ? (
                      <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 shrink-0">
                            {nextAppointment.doctor?.name?.charAt(4) || 'D'} 
                          </div>
                          <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                              {nextAppointment.doctor?.name || 'Doctor Name'}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">General Consultation</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Date & Time</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {new Date(nextAppointment.time).toLocaleDateString([], { month: 'short', day: 'numeric' })} @ {new Date(nextAppointment.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">Status</p>
                            <p className="font-bold text-amber-600 dark:text-amber-400">{nextAppointment.status}</p>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button size="sm" variant="outline" className="w-full text-[11px] border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => triggerAIAction("I need to reschedule my upcoming appointment.")}>
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p className="text-sm mb-4">No upcoming appointments.</p>
                        <Button size="sm" className="bg-blue-600" onClick={() => setActiveView('assistant')}>Book Now</Button>
                      </div>
                    )}
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Pill size={16} className="text-blue-500" /> Active Prescriptions
                    </h3>
                    <div className="space-y-3">
                      {activePrescriptions.map(med => (
                        <div key={med.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                           <div className="flex justify-between items-start">
                             <div>
                               <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{med.name} <span className="text-slate-400 text-xs font-normal ml-1">{med.dosage}</span></p>
                               <p className="text-xs text-slate-500 mt-0.5">{med.frequency}</p>
                             </div>
                             <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded ${med.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                               {med.status}
                             </span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ================= MEDICAL RECORDS VIEW ================= */}
          {activeView === 'records' && (
             <motion.div key="records" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-4xl mx-auto space-y-6">
                 <Card className="p-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Complete Visit History</h3>
                      <p className="text-sm text-slate-500 mt-1">Review past diagnoses, doctor notes, and billing history.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Doctor</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">Documents</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {history.length > 0 ? history.map((apt) => (
                            <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                                {new Date(apt.time).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">{apt.doctor?.name || 'General'}</td>
                              <td className="px-6 py-4">Consultation</td>
                              <td className="px-6 py-4 text-right">
                                <button className="text-blue-600 hover:underline text-xs font-semibold">View Details</button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No records found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
             </motion.div>
          )}

          {/* ================= PROFILE VIEW ================= */}
          {activeView === 'profile' && (
             <motion.div key="profile" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-3xl mx-auto space-y-6">
                 <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full bg-blue-50 border-4 border-blue-500 flex items-center justify-center overflow-hidden mb-4">
                       <span className="text-5xl text-blue-300 font-bold">{user?.name?.charAt(0) || 'P'}</span>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">{user?.name || 'Patient'}</h3>
                    <p className="text-sm text-slate-500 mt-1">{user?.email || 'patient@example.com'}</p>
                 </Card>

                 <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                   <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Medical History Notes</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">This information helps doctors provide better care during your visits.</p>
                   <textarea
                     value={bio}
                     onChange={(e) => setBio(e.target.value)}
                     className="w-full min-h-[150px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                     placeholder="List any known allergies, chronic conditions, or ongoing treatments..."
                   />
                   <div className="flex justify-end mt-4">
                     <Button isLoading={isSavingProfile} onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">Save Updates</Button>
                   </div>
                 </Card>
             </motion.div>
          )}

          {/* ================= SETTINGS VIEW ================= */}
          {activeView === 'settings' && (
             <motion.div key="settings" variants={containerVariants} initial="hidden" animate="show" exit="exit" className="max-w-2xl mx-auto">
                 <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center">
                   <Settings size={48} className="mx-auto text-slate-300 mb-4" />
                   <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Account Settings</h3>
                   <p className="text-slate-500 mb-6">Manage your notification preferences, password, and security settings.</p>
                   <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg inline-block">Settings panel is currently under construction.</p>
                 </Card>
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

const VitalCard = ({ title, value, unit, icon }) => (
  <motion.div variants={itemVariants}>
    <Card className="p-4 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-center">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {icon}
      </div>
      <div className="flex items-baseline gap-1">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</h3>
        <span className="text-xs font-medium text-slate-400">{unit}</span>
      </div>
    </Card>
  </motion.div>
);

const ActionPill = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors rounded-full text-xs font-semibold"
  >
    {icon} {label}
  </button>
);