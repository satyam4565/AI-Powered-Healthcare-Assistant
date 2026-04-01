import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { getDoctorAvailability, updateDoctorAvailability } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_START = '09:00:00';
const DEFAULT_END = '17:00:00';

export const DoctorSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load existing schedule on mount
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await getDoctorAvailability();
        const existingSchedule = data.schedule || [];
        
        // Merge existing data with our 7-day template
        const fullWeek = DAYS.map(day => {
          const existing = existingSchedule.find(s => s.day_of_week === day);
          return existing ? { ...existing } : { 
            day_of_week: day, 
            is_working: false, 
            start_time: DEFAULT_START, 
            end_time: DEFAULT_END 
          };
        });
        
        setSchedule(fullWeek);
      } catch (error) {
        console.error("Failed to load schedule", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedule();
  }, []);

  const handleToggle = (index) => {
    const newSchedule = [...schedule];
    newSchedule[index].is_working = !newSchedule[index].is_working;
    setSchedule(newSchedule);
  };

  const handleTimeChange = (index, field, value) => {
    const newSchedule = [...schedule];
    // Ensure the time has seconds for the backend (HH:MM:SS)
    newSchedule[index][field] = value.length === 5 ? `${value}:00` : value;
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      await updateDoctorAvailability(schedule);
      setMessage('Schedule saved successfully! The AI will now respect these hours.');
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('Error saving schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-4 text-slate-400">Loading schedule settings...</div>;

  return (
    <Card className="mt-6 border-indigo-500/20 bg-slate-800/40">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-indigo-300 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Weekly Working Hours
            </CardTitle>
            <CardDescription>Set when the AI can book your appointments.</CardDescription>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {schedule.map((day, index) => (
          <div key={day.day_of_week} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 gap-4">
            
            {/* Day Toggle */}
            <label className="flex items-center cursor-pointer gap-3 min-w-[120px]">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={day.is_working}
                  onChange={() => handleToggle(index)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${day.is_working ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${day.is_working ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className={`font-medium ${day.is_working ? 'text-slate-200' : 'text-slate-500'}`}>
                {day.day_of_week}
              </span>
            </label>

            {/* Time Pickers */}
            <div className={`flex items-center gap-2 transition-opacity ${day.is_working ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <input 
                type="time" 
                value={day.start_time?.substring(0, 5) || "09:00"} 
                onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <span className="text-slate-500 text-sm">to</span>
              <input 
                type="time" 
                value={day.end_time?.substring(0, 5) || "17:00"} 
                onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

          </div>
        ))}
        {message && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-emerald-400 mt-4 text-center">
            {message}
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
};