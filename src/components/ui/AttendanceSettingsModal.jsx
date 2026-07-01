import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineCog, HiOutlineSave } from 'react-icons/hi';

export default function AttendanceSettingsModal({ isOpen, onClose, settings, onSave }) {
  const [lateTime, setLateTime] = useState('10:00');
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5, 6]); // 0=Sun, 1=Mon...

  useEffect(() => {
    if (settings && isOpen) {
      setLateTime(settings.lateTime || '10:00');
      setWorkingDays(settings.workingDays || [1, 2, 3, 4, 5, 6]);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleDayToggle = (dayIndex) => {
    setWorkingDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleSave = () => {
    onSave({ lateTime, workingDays });
    onClose();
  };

  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <HiOutlineCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Attendance Settings</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Customize late & leave calculation rules</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Late Threshold Time */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Late Threshold Time</label>
            <p className="text-xs text-slate-500 mb-3">Staff logging in after this time will be marked as Late.</p>
            <input 
              type="time" 
              className="input w-full font-bold text-slate-800"
              value={lateTime}
              onChange={(e) => setLateTime(e.target.value)}
            />
          </div>

          {/* Working Days */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Expected Working Days</label>
            <p className="text-xs text-slate-500 mb-3">Select the days your shop is open. Unselected days won't count as Leaves.</p>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => {
                const isSelected = workingDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border ${
                      isSelected 
                        ? 'bg-brand-50 text-brand-600 border-brand-200 shadow-sm' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <HiOutlineSave className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
