import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getDoctorAvailability, updateDoctorAvailability } from '../../services/api';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await getDoctorAvailability();
        const existingSchedule = data.schedule || [];
        const fullWeek = DAYS.map(day => {
          const existing = existingSchedule.find(s => s.day_of_week === day);
          return existing ? { ...existing } : { 
            day_of_week: day, 
            is_working: false, 
            start_time: '09:00:00', 
            end_time: '17:00:00' 
          };
        });
        setSchedule(fullWeek);
      } catch (error) {
        toast.error("Failed to load schedule");
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
    newSchedule[index][field] = value.length === 5 ? `${value}:00` : value;
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoctorAvailability(schedule);
      toast.success('Weekly schedule saved successfully');
    } catch (error) {
      toast.error('Error saving schedule');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-4 text-slate-400">Loading schedule...</div>;

  return (
    <Card className="p-6 h-full flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock size={18} className="text-indigo-500 dark:text-indigo-400" />
          Weekly Scheduler
        </h3>
        <Button onClick={handleSave} isLoading={isSaving} size="sm">
          Save Schedule
        </Button>
      </div>

      {/* Changed space-y to flex-1 and justify-between to evenly distribute rows */}
      <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto pr-1 custom-scrollbar">
        {schedule.map((day, index) => (
          <div key={day.day_of_week} className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-colors ${day.is_working ? 'bg-indigo-50/50 dark:bg-slate-800/60 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800'}`}>
            
            {/* Left side: Toggle & Day Name */}
            <label className="flex items-center cursor-pointer gap-3 min-w-[100px] shrink-0">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={day.is_working}
                  onChange={() => handleToggle(index)}
                />
                <div className={`block w-10 h-5 rounded-full transition-colors ${day.is_working ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${day.is_working ? 'transform translate-x-5' : ''}`}></div>
              </div>
              <span className={`font-medium text-sm ${day.is_working ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                {/* Optional: Shorten day name on small screens, keep full on large */}
                <span className="hidden sm:inline">{day.day_of_week}</span>
                <span className="sm:hidden">{day.day_of_week.substring(0, 3)}</span>
              </span>
            </label>

            {/* Right side: Time Inputs */}
            <div className={`flex items-center justify-end gap-1 sm:gap-2 transition-opacity ${day.is_working ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <input 
                type="time" 
                value={day.start_time?.substring(0, 5) || "09:00"} 
                onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-[85px] sm:w-auto text-center"
              />
              <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
              <input 
                type="time" 
                value={day.end_time?.substring(0, 5) || "17:00"} 
                onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-[85px] sm:w-auto text-center"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};