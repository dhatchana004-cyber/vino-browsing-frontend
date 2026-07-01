import React, { useState, useMemo } from 'react';
import { getLocalDateString } from '../utils/date';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlineClock } from 'react-icons/hi';
import DateFilter from '../components/ui/DateFilter';
import { useAttendance, useStaffList } from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AttendanceSettingsModal from '../components/ui/AttendanceSettingsModal';
import { HiOutlineCog } from 'react-icons/hi';

export default function StaffAttendance() {
  const [dateFrom, setDateFrom] = useState(getLocalDateString());
  const [dateTo, setDateTo] = useState(getLocalDateString());
  const [staffId, setStaffId] = useState('');

  const { data: staffList } = useStaffList();
  const params = { date_from: dateFrom, date_to: dateTo };
  if (staffId) params.staff = staffId;
  const { data: attendanceData, isLoading } = useAttendance(params);
  const attendance = attendanceData?.results || attendanceData || [];

  const [expandedRow, setExpandedRow] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('attendanceSettings');
    return saved ? JSON.parse(saved) : { lateTime: '10:00', workingDays: [1, 2, 3, 4, 5, 6] };
  });

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('attendanceSettings', JSON.stringify(newSettings));
  };

  const getExpectedWorkingDays = (startStr, endStr, wDays) => {
    let start = new Date(startStr);
    const end = new Date(endStr);
    let count = 0;
    while (start <= end) {
      if (wDays.includes(start.getDay())) count++;
      start.setDate(start.getDate() + 1);
    }
    return count;
  };

  const isLate = (isoString) => {
    if (!isoString) return false;
    const d = new Date(isoString);
    const [lateH, lateM] = settings.lateTime.split(':').map(Number);
    return d.getHours() > lateH || (d.getHours() === lateH && d.getMinutes() > lateM);
  };

  const { groupedRows, staffSummaries } = useMemo(() => {
    // 1. Group records by Staff AND Date to create rows
    const rowMap = {};
    attendance.forEach(record => {
      const key = `${record.staff}_${record.date}`;
      if (!rowMap[key]) {
        const staffObj = staffList?.find(s => s.id === record.staff);
        rowMap[key] = {
          row_id: key,
          staff_id: record.staff,
          staff_name: record.staff_name,
          staff_photo: staffObj?.profile_photo || null,
          staff_initial: staffObj?.first_name?.[0] || record.staff_name[0].toUpperCase(),
          date: record.date,
          records: [],
          isActive: false,
          totalDurationMs: 0,
        };
      }
      rowMap[key].records.push(record);
      if (!record.logout_time) rowMap[key].isActive = true;
      
      if (record.working_hours) {
        const [h, m, s] = record.working_hours.split(':').map(Number);
        rowMap[key].totalDurationMs += ((h * 60 * 60) + (m * 60) + (s || 0)) * 1000;
      }
    });

    const rows = Object.values(rowMap).sort((a, b) => new Date(b.date) - new Date(a.date));

    // 2. Calculate Summaries per Staff
    const summaryMap = {};
    const staffToSummarize = staffId ? staffList?.filter(s => s.id === parseInt(staffId)) : staffList;
    staffToSummarize?.forEach(s => {
      summaryMap[s.id] = { staff_name: s.full_name || s.username, present: 0, late: 0, leaves: 0 };
    });

    const staffPresence = {};
    rows.forEach(row => {
      if (!staffPresence[row.staff_id]) staffPresence[row.staff_id] = new Set();
      staffPresence[row.staff_id].add(row.date);

      if (summaryMap[row.staff_id]) {
        summaryMap[row.staff_id].present += 1;
        const sortedRecords = [...row.records].sort((a, b) => new Date(a.login_time) - new Date(b.login_time));
        if (sortedRecords.length > 0 && isLate(sortedRecords[0].login_time)) {
          summaryMap[row.staff_id].late += 1;
        }
      }
    });

    const todayStr = getLocalDateString();
    let d = new Date(dateFrom);
    const endDate = new Date(dateTo);
    
    while (d <= endDate) {
      const dateStr = getLocalDateString(d);
      const isWorkingDay = settings.workingDays.includes(d.getDay());
      const isPastDay = dateStr < todayStr;
      
      if (isWorkingDay) {
        staffToSummarize?.forEach(s => {
          const isPresent = staffPresence[s.id]?.has(dateStr);
          if (!isPresent && isPastDay) {
             summaryMap[s.id].leaves += 1;
          }
        });
      }
      d.setDate(d.getDate() + 1);
    }

    return { groupedRows: rows, staffSummaries: Object.values(summaryMap) };
  }, [attendance, staffList, dateFrom, dateTo, settings, staffId]);

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDuration = (durationStr) => {
    if (!durationStr) return '-';
    const parts = durationStr.split(':');
    return `${parts[0]}h ${parts[1]}m`;
  };

  const formatTotalDuration = (ms) => {
    if (ms === 0) return '-';
    const totalMinutes = Math.floor(ms / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Attendance</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Monitor staff login and logout times</p>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap gap-4">
          <DateFilter isRange dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
          
          <div className="flex gap-4">
            <select className="select w-48" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">All Staff</option>
              {staffList?.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.username}</option>)}
            </select>
            <button className="btn-secondary" onClick={() => { 
              const today = getLocalDateString();
              setDateFrom(today); 
              setDateTo(today); 
              setStaffId(''); 
            }}>Clear</button>
            <button className="btn-secondary flex items-center gap-2" onClick={() => setIsSettingsOpen(true)}>
              <HiOutlineCog className="w-5 h-5" /> Settings
            </button>
          </div>
        </div>
      </div>

      {!isLoading && (
        <>
          {/* Summary Section */}
          {staffId ? (
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div className="card py-4 bg-brand-50 border-brand-100 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-brand-700">{staffSummaries[0]?.present || 0}</div>
                <div className="text-xs font-bold text-brand-600/70 uppercase tracking-wider mt-1">Present Days</div>
              </div>
              <div className="card py-4 bg-rose-50 border-rose-100 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-rose-700">{staffSummaries[0]?.late || 0}</div>
                <div className="text-xs font-bold text-rose-600/70 uppercase tracking-wider mt-1">Late Days</div>
              </div>
              <div className="card py-4 bg-amber-50 border-amber-100 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-amber-700">{staffSummaries[0]?.leaves || 0}</div>
                <div className="text-xs font-bold text-amber-600/70 uppercase tracking-wider mt-1">Leave Days</div>
              </div>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden mb-6">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-bold text-slate-700 text-sm">
                Staff Attendance Summary
              </div>
              <div className="table-container">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th className="text-center">Present</th>
                      <th className="text-center">Late</th>
                      <th className="text-center">Leaves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffSummaries.map(s => (
                      <tr key={s.staff_name}>
                        <td className="font-bold text-slate-800">{s.staff_name}</td>
                        <td className="text-center font-bold text-brand-600">{s.present}</td>
                        <td className="text-center font-bold text-rose-500">{s.late}</td>
                        <td className="text-center font-bold text-amber-600">{s.leaves}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Staff Member</th>
                  <th>Joins</th>
                  <th>Total Working Hours</th>
                  <th>Status</th>
                  <th>View Log</th>
                </tr>
              </thead>
              <tbody>
                {groupedRows?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium">No attendance records found for this period.</td></tr>
                ) : (
                  groupedRows?.map((row) => {
                    const firstRecord = [...row.records].sort((a, b) => new Date(a.login_time) - new Date(b.login_time))[0];
                    const isRowLate = isLate(firstRecord?.login_time);

                    return (
                    <React.Fragment key={row.row_id}>
                      <tr>
                        <td className="text-slate-500 font-medium">{new Date(row.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="font-bold text-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center border border-brand-100 shadow-sm overflow-hidden">
                              {row.staff_photo ? (
                                <img src={row.staff_photo} alt={row.staff_name} className="w-full h-full object-cover" />
                              ) : (
                                row.staff_initial
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{row.staff_name}</span>
                              {isRowLate && <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Late</span>}
                            </div>
                          </div>
                        </td>
                        <td className="font-bold text-brand-600">{row.records.length}</td>
                        <td className="font-bold text-slate-700">{formatTotalDuration(row.totalDurationMs)}</td>
                        <td>
                          {row.isActive ? (
                            <span className="badge bg-success-bg text-success-text border border-success-border">Active</span>
                          ) : (
                            <span className="badge bg-slate-100 text-slate-600 border border-slate-200">Logged Out</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="text-brand-600 text-xs font-bold hover:underline"
                            onClick={() => setExpandedRow(expandedRow === row.row_id ? null : row.row_id)}
                          >
                            {expandedRow === row.row_id ? 'Hide Log' : 'View Log'}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === row.row_id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="p-4 border-b border-slate-100">
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-w-2xl">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-2 text-left font-semibold">Login Time</th>
                                    <th className="px-4 py-2 text-left font-semibold">Logout Time</th>
                                    <th className="px-4 py-2 text-left font-semibold">Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[...row.records].sort((a,b) => new Date(a.login_time) - new Date(b.login_time)).map((rec, index) => {
                                    const isFirstLogin = index === 0;
                                    return (
                                      <tr key={rec.id} className="border-t border-slate-100">
                                        <td className="px-4 py-2 text-brand-600 font-medium">
                                          <div className="flex items-center gap-2">
                                            {formatTime(rec.login_time)}
                                            {isFirstLogin && isLate(rec.login_time) && <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Late</span>}
                                          </div>
                                        </td>
                                        <td className="px-4 py-2 text-slate-500">{formatTime(rec.logout_time)}</td>
                                        <td className="px-4 py-2 text-slate-700 font-medium">{formatDuration(rec.working_hours)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AttendanceSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
