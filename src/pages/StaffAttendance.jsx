import React, { useState, useMemo } from 'react';
import { getLocalDateString } from '../utils/date';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlineClock } from 'react-icons/hi';
import DateFilter from '../components/ui/DateFilter';
import { useAttendance, useStaffList } from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function StaffAttendance() {
  const [dateFrom, setDateFrom] = useState(getLocalDateString());
  const [dateTo, setDateTo] = useState(getLocalDateString());
  const [staffId, setStaffId] = useState('');

  const { data: staffList } = useStaffList();
  const params = { date_from: dateFrom, date_to: dateTo };
  if (staffId) params.staff = staffId;
  const { data: attendanceData, isLoading } = useAttendance(params);
  const attendance = attendanceData?.results || attendanceData || [];

  const [expandedStaff, setExpandedStaff] = useState(null);

  const groupedAttendance = useMemo(() => {
    const groups = {};
    attendance.forEach(record => {
      const key = record.staff;
      if (!groups[key]) {
        const staffObj = staffList?.find(s => s.id === record.staff);
        groups[key] = {
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
      groups[key].records.push(record);
      if (!record.logout_time) {
        groups[key].isActive = true;
      }
      
      if (record.working_hours) {
        const [h, m, s] = record.working_hours.split(':').map(Number);
        groups[key].totalDurationMs += ((h * 60 * 60) + (m * 60) + (s || 0)) * 1000;
      }
    });
    return Object.values(groups);
  }, [attendance, staffList]);

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

  const isLate = (isoString) => {
    if (!isoString) return false;
    const d = new Date(isoString);
    return d.getHours() > 10 || (d.getHours() === 10 && d.getMinutes() > 0);
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
        </div>
        </div>
      </div>

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
                {groupedAttendance?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium">No attendance records found for this date.</td></tr>
                ) : (
                  groupedAttendance?.map((group) => (
                    <React.Fragment key={group.staff_id}>
                      <tr>
                        <td className="text-slate-500 font-medium">{group.date}</td>
                        <td className="font-bold text-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center border border-brand-100 shadow-sm overflow-hidden">
                              {group.staff_photo ? (
                                <img src={group.staff_photo} alt={group.staff_name} className="w-full h-full object-cover" />
                              ) : (
                                group.staff_initial
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{group.staff_name}</span>
                              {isLate(group.records[group.records.length - 1].login_time) && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Late</span>}
                            </div>
                          </div>
                        </td>
                        <td className="font-bold text-brand-600">{group.records.length}</td>
                        <td className="font-bold text-slate-700">{formatTotalDuration(group.totalDurationMs)}</td>
                        <td>
                          {group.isActive ? (
                            <span className="badge bg-success-bg text-success-text border border-success-border">Active</span>
                          ) : (
                            <span className="badge bg-slate-100 text-slate-600 border border-slate-200">Log Out</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="text-brand-600 text-xs font-bold hover:underline"
                            onClick={() => setExpandedStaff(expandedStaff === group.staff_id ? null : group.staff_id)}
                          >
                            {expandedStaff === group.staff_id ? 'Hide Log' : 'View Log'}
                          </button>
                        </td>
                      </tr>
                      {expandedStaff === group.staff_id && (
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
                                  {group.records.map((rec, index) => {
                                    const isFirstLogin = index === group.records.length - 1;
                                    return (
                                      <tr key={rec.id} className="border-t border-slate-100">
                                        <td className="px-4 py-2 text-brand-600 font-medium">
                                          <div className="flex items-center gap-2">
                                            {formatTime(rec.login_time)}
                                            {isFirstLogin && isLate(rec.login_time) && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Late</span>}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
