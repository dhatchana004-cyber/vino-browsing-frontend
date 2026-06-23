import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { getLocalDateString } from '../../utils/date';

export default function DateFilter({
  isRange = false,
  date,
  setDate,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  minDate,
  maxDate,
  hidePresets = false,
  className = ''
}) {
  const [preset, setPreset] = useState(hidePresets ? 'custom' : 'all');
  const dateInputRef = useRef(null);

  const getToday = () => getLocalDateString();
  const getYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  };

  // Sync preset if dates are empty (cleared from outside)
  useEffect(() => {
    if (isRange) {
      if (!dateFrom && !dateTo) {
        setPreset('custom');
      }
    } else {
      if (!date) {
        setPreset('custom');
      }
    }
  }, [isRange, date, dateFrom, dateTo]);

  // Initial load logic: if dates match today/yesterday, set preset accordingly
  useEffect(() => {
    if (preset !== 'all' && preset !== 'today') return; // only run on mount essentially

    const today = getToday();
    if (isRange) {
      if (dateFrom === today && dateTo === today) {
        setPreset('today');
      } else if (!dateFrom && !dateTo) {
        setPreset('all');
      } else {
        setPreset('custom');
      }
    } else {
      if (date === today) {
        setPreset('today');
      } else if (!date) {
        setPreset('all');
      } else {
        setPreset('custom');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setPreset(val);
    
    if (val === 'all') {
      if (isRange) {
        setDateFrom('');
        setDateTo('');
      } else {
        setDate('');
      }
    } else if (val === 'today') {
      const today = getToday();
      if (isRange) {
        setDateFrom(today);
        setDateTo(today);
      } else {
        setDate(today);
      }
    } else if (val === 'yesterday') {
      const yesterday = getYesterday();
      if (isRange) {
        setDateFrom(yesterday);
        setDateTo(yesterday);
      } else {
        setDate(yesterday);
      }
    } else {
      setPreset(val);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {!hidePresets && (
        <select className="select w-auto font-medium" value={preset} onChange={handlePresetChange}>
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="custom">Customise</option>
        </select>
      )}
      
      {(preset === 'custom' || hidePresets) && (
        isRange ? (
          <div className="flex items-center gap-2">
            <input ref={dateInputRef} type="date" className="input w-auto min-w-[140px] font-medium px-3" value={dateFrom || ''} onChange={e => setDateFrom(e.target.value)} min={minDate} max={maxDate} />
            <span className="text-slate-400 font-medium flex-shrink-0">to</span>
            <input type="date" className="input w-auto min-w-[140px] font-medium px-3" value={dateTo || ''} onChange={e => setDateTo(e.target.value)} min={minDate} max={maxDate} />
          </div>
        ) : (
          <input ref={dateInputRef} type="date" className="input w-auto font-medium" value={date || ''} onChange={e => setDate(e.target.value)} min={minDate} max={maxDate} />
        )
      )}
    </div>
  );
}
