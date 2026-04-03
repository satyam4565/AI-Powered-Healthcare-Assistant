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
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock size={18} className="text-indigo-400" />
          Weekly Scheduler
        </h3>
        <Button onClick={handleSave} isLoading={isSaving} size="sm">
          Save Schedule
        </Button>
      </div>

      <div className="space-y-3">
        {schedule.map((day, index) => (
          <div key={day.day_of_week} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${day.is_working ? 'bg-slate-800/60 border-indigo-500/30' : 'bg-slate-900/30 border-slate-800'}`}>
            <label className="flex items-center cursor-pointer gap-4 w-1/3">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={day.is_working}
                  onChange={() => handleToggle(index)}
                />
                <div className={`block w-12 h-6 rounded-full transition-colors ${day.is_working ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${day.is_working ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <span className={`font-medium ${day.is_working ? 'text-white' : 'text-slate-500'}`}>
                {day.day_of_week}
              </span>
            </label>

            <div className={`flex items-center gap-3 transition-opacity ${day.is_working ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <input 
                type="time" 
                value={day.start_time?.substring(0, 5) || "09:00"} 
                onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <span className="text-slate-500">—</span>
              <input 
                type="time" 
                value={day.end_time?.substring(0, 5) || "17:00"} 
                onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};