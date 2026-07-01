import { useState, useMemo } from 'react';
import { useDailyReport, useAttendance } from '../hooks/useApi';
import { getLocalDateString } from '../utils/date';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import DateFilter from '../components/ui/DateFilter';

export default function StaffReports() {
  const [perfDateFrom, setPerfDateFrom] = useState(getLocalDateString());
  const [perfDateTo, setPerfDateTo] = useState(getLocalDateString());
  
  const [attDateFrom, setAttDateFrom] = useState(getLocalDateString());
  const [attDateTo, setAttDateTo] = useState(getLocalDateString());
  
  let displayTitle = 'Performance Report';
  if (perfDateFrom && perfDateTo) {
    if (perfDateFrom === perfDateTo) {
      if (perfDateFrom === getLocalDateString()) displayTitle = "Today's Performance";
      else displayTitle = `Performance for ${new Date(perfDateFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      displayTitle = `Performance from ${new Date(perfDateFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} to ${new Date(perfDateTo).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  } else {
    displayTitle = "All Time Performance";
  }

  const daily = useDailyReport(perfDateFrom, perfDateTo);
  const { data: attendanceData, isLoading: isAttendanceLoading } = useAttendance({ date_from: attDateFrom, date_to: attDateTo });
  
  const attendance = attendanceData?.results || attendanceData || [];

  const [settings] = useState(() => {
    const saved = localStorage.getItem('attendanceSettings');
    return saved ? JSON.parse(saved) : { lateTime: '10:00', workingDays: [1, 2, 3, 4, 5, 6] };
  });

  const isLate = (isoString) => {
    if (!isoString) return false;
    const date = new Date(isoString);
    const [lateH, lateM] = settings.lateTime.split(':').map(Number);
    return date.getHours() > lateH || (date.getHours() === lateH && date.getMinutes() > lateM);
  };

  const { present, late, leaves } = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let leavesCount = 0;
    
    // Group by date
    const rowsByDate = {};
    attendance.forEach(rec => {
      if (!rowsByDate[rec.date]) rowsByDate[rec.date] = [];
      rowsByDate[rec.date].push(rec);
    });

    const datesPresent = new Set(Object.keys(rowsByDate));
    presentCount = datesPresent.size;

    Object.values(rowsByDate).forEach(records => {
      const sorted = [...records].sort((a, b) => new Date(a.login_time) - new Date(b.login_time));
      if (sorted.length > 0 && isLate(sorted[0].login_time)) {
        lateCount++;
      }
    });

    // Calculate leaves
    const todayStr = getLocalDateString();
    
    // Default to a reasonable range if all time is selected
    const startRangeStr = attDateFrom || (attendance.length > 0 ? [...attendance].sort((a,b)=>new Date(a.date)-new Date(b.date))[0].date : todayStr);
    const endRangeStr = attDateTo || todayStr;
    
    let d = new Date(startRangeStr);
    const endDate = new Date(endRangeStr);
    
    while (d <= endDate) {
      const dateStr = getLocalDateString(d);
      const isWorkingDay = settings.workingDays.includes(d.getDay());
      const isPastDay = dateStr < todayStr;
      
      if (isWorkingDay && !datesPresent.has(dateStr) && isPastDay) {
        leavesCount++;
      }
      d.setDate(d.getDate() + 1);
    }

    return { present: presentCount, late: lateCount, leaves: leavesCount };
  }, [attendance, attDateFrom, attDateTo, settings]);

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Reports</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">{displayTitle}</p>
      </div>

      <div className="card p-4">
        <DateFilter isRange dateFrom={perfDateFrom} setDateFrom={setPerfDateFrom} dateTo={perfDateTo} setDateTo={setPerfDateTo} />
      </div>

      <div className="space-y-6">

        {daily.isLoading ? <LoadingSpinner /> : daily.data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <div className="card-stat hover:-translate-y-1.5 transition-transform duration-300"><div className="text-3xl font-bold text-blue-600">₹{Number(daily.data.total_amount || 0).toLocaleString('en-IN')}</div><div className="text-sm font-medium text-slate-500 mt-1">Amount Collected</div></div>
            <div className="card-stat hover:-translate-y-1.5 transition-transform duration-300"><div className="text-3xl font-bold text-amber-500">₹{Number(daily.data.total_charge || 0).toLocaleString('en-IN')}</div><div className="text-sm font-medium text-slate-500 mt-1">Service Charges</div></div>
            <div className="card-stat hover:-translate-y-1.5 transition-transform duration-300"><div className="text-3xl font-bold text-brand-600">₹{Number(daily.data.total_profit || 0).toLocaleString('en-IN')}</div><div className="text-sm font-medium text-slate-500 mt-1">Total Profit</div></div>
            <div className="card-stat hover:-translate-y-1.5 transition-transform duration-300"><div className="text-3xl font-bold text-slate-800">{daily.data.total_entries}</div><div className="text-sm font-medium text-slate-500 mt-1">Service Entries</div></div>
          </div>
        )}

        <div className="pt-4 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-slate-700">My Attendance Summary</h3>
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <DateFilter isRange dateFrom={attDateFrom} setDateFrom={setAttDateFrom} dateTo={attDateTo} setDateTo={setAttDateTo} />
            </div>
          </div>
          {isAttendanceLoading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-3 gap-4">
              <div className="card py-5 bg-brand-50 border-brand-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl font-bold text-brand-700">{present}</div>
                <div className="text-xs font-bold text-brand-600/70 uppercase tracking-wider mt-1">Present Days</div>
              </div>
              <div className="card py-5 bg-rose-50 border-rose-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl font-bold text-rose-700">{late}</div>
                <div className="text-xs font-bold text-rose-600/70 uppercase tracking-wider mt-1">Late Days</div>
              </div>
              <div className="card py-5 bg-amber-50 border-amber-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl font-bold text-amber-700">{leaves}</div>
                <div className="text-xs font-bold text-amber-600/70 uppercase tracking-wider mt-1">Leave Days</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
