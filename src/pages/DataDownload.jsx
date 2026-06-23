import { useState } from 'react';
import api from '../api/axios';
import { useStaffList } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { HiOutlineDownload, HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineUsers } from 'react-icons/hi';
import DateFilter from '../components/ui/DateFilter';
import { getLocalDateString } from '../utils/date';

export default function DataDownload() {
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(getLocalDateString());
  const [dateTo, setDateTo] = useState(getLocalDateString());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear());
  const [staffId, setStaffId] = useState('');
  const [startDateStaff, setStartDateStaff] = useState(getLocalDateString());
  const [endDateStaff, setEndDateStaff] = useState(getLocalDateString());
  const [startDateCust, setStartDateCust] = useState(getLocalDateString());
  const [endDateCust, setEndDateCust] = useState(getLocalDateString());
  const [startDateExp, setStartDateExp] = useState(getLocalDateString());
  const [endDateExp, setEndDateExp] = useState(getLocalDateString());

  const { data: staffList } = useStaffList();

  const handleDownload = async (type) => {
    setLoading(true);
    try {
      const params = {};
      let endpoint = '';
      let filename = '';

      if (type === 'daily') {
        endpoint = '/download/daily/';
        params.start_date = dateFrom;
        params.end_date = dateTo;
        filename = `Custom_Report_${dateFrom}_to_${dateTo}.xlsx`;
      } else if (type === 'monthly') {
        endpoint = '/download/monthly/';
        params.month = month;
        params.year = year;
        filename = `Monthly_Report_${year}_${month}.xlsx`;
      } else if (type === 'yearly') {
        endpoint = '/download/yearly/';
        params.year = yearlyYear;
        filename = `Yearly_Report_${yearlyYear}.xlsx`;
      } else if (type === 'staff') {
        endpoint = '/download/staff/';
        if (staffId) params.staff_id = staffId;
        if (startDateStaff) params.start_date = startDateStaff;
        if (endDateStaff) params.end_date = endDateStaff;
        const staffName = staffId ? staffList?.find(s => s.id === Number(staffId))?.first_name || staffId : 'All';
        filename = `Staff_Attendance_${staffName}.xlsx`;
      } else if (type === 'customers') {
        endpoint = '/download/customers/';
        if (startDateCust) params.start_date = startDateCust;
        if (endDateCust) params.end_date = endDateCust;
        filename = 'VINO_Customers.csv';
      } else if (type === 'expenses') {
        endpoint = '/download/expenses/';
        if (startDateExp) params.start_date = startDateExp;
        if (endDateExp) params.end_date = endDateExp;
        filename = `VINO_Expenses${startDateExp ? `_${startDateExp}` : ''}.xlsx`;
      }

      const response = await api.get(endpoint, { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Download</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Export your data to Excel format</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Daily Download */}
        <div className="card p-6 border-fuchsia-200 shadow-sm relative overflow-hidden group flex flex-col h-full">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-fuchsia-50 rounded-full transition-transform group-hover:scale-110" />
          <HiOutlineDocumentText className="relative w-8 h-8 text-fuchsia-600 mb-4" />
          <h3 className="relative text-lg font-bold text-slate-800 mb-2">Daily Export</h3>
          <p className="relative text-sm text-slate-500 mb-6 flex-grow">Download a complete list of service entries, expenses, and staff performance for a selected date range.</p>
          
          <div className="relative space-y-4 mt-auto">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="input-label mb-2 block">Date Range</label>
                <DateFilter isRange dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
              </div>
            </div>
            <button
              onClick={() => handleDownload('daily')}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <HiOutlineDownload className="w-5 h-5" /> Export Daily Data
            </button>
          </div>
        </div>

        {/* Monthly Download */}
        <div className="card p-6 border-blue-200 shadow-sm relative overflow-hidden group flex flex-col h-full">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full transition-transform group-hover:scale-110" />
          <HiOutlineDocumentText className="relative w-8 h-8 text-blue-600 mb-4" />
          <h3 className="relative text-lg font-bold text-slate-800 mb-2">Monthly Export</h3>
          <p className="relative text-sm text-slate-500 mb-6 flex-grow">Download an aggregated financial report for an entire month, including daily breakdowns.</p>
          
          <div className="relative space-y-4 mt-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Select Month</label>
                <select className="select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Select Year</label>
                <input type="number" className="input" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2030} />
              </div>
            </div>
            <button
              onClick={() => handleDownload('monthly')}
              disabled={loading}
              className="btn-primary w-full bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              <HiOutlineDownload className="w-5 h-5" /> Export Monthly Data
            </button>
          </div>
        </div>

        {/* Yearly Download */}
        <div className="card p-6 border-orange-200 shadow-sm relative overflow-hidden group flex flex-col h-full">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-50 rounded-full transition-transform group-hover:scale-110" />
          <HiOutlineDocumentText className="relative w-8 h-8 text-orange-600 mb-4" />
          <h3 className="relative text-lg font-bold text-slate-800 mb-2">Yearly Export</h3>
          <p className="relative text-sm text-slate-500 mb-6 flex-grow">Download a complete financial report and service entries for an entire year.</p>
          
          <div className="relative space-y-4 mt-auto">
            <div>
              <label className="input-label">Select Year</label>
              <input type="number" className="input" value={yearlyYear} onChange={(e) => setYearlyYear(Number(e.target.value))} min={2020} max={2030} />
            </div>
            <button
              onClick={() => handleDownload('yearly')}
              disabled={loading}
              className="btn-primary w-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/20 hover:shadow-orange-500/30 flex items-center justify-center gap-2"
            >
              <HiOutlineDownload className="w-5 h-5" /> Export Yearly Data
            </button>
          </div>
        </div>
        {/* Staff Attendance Download */}
        <div className="card p-6 border-emerald-200 shadow-sm relative overflow-hidden group flex flex-col h-full">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full transition-transform group-hover:scale-110" />
          <HiOutlineUserGroup className="relative w-8 h-8 text-emerald-600 mb-4" />
          <h3 className="relative text-lg font-bold text-slate-800 mb-2">Staff Attendance Export</h3>
          <p className="relative text-sm text-slate-500 mb-6 flex-grow">Download attendance records (login/logout times and working hours) for a specific staff member or all staff.</p>
          
          <div className="relative space-y-4 mt-auto">
            <div>
              <label className="input-label">Select Staff</label>
              <select className="select" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                <option value="">All Staff</option>
                {staffList?.map(s => <option key={s.id} value={s.id}>{s.first_name || s.username}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="input-label mb-2 block">Date Range</label>
                <DateFilter 
                  isRange 
                  dateFrom={startDateStaff} 
                  setDateFrom={setStartDateStaff} 
                  dateTo={endDateStaff} 
                  setDateTo={setEndDateStaff} 
                />
              </div>
            </div>
            <button
              onClick={() => handleDownload('staff')}
              disabled={loading}
              className="btn-primary w-full bg-gradient-to-r from-emerald-600 to-teal-500 shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <HiOutlineDownload className="w-5 h-5" /> Export Staff Attendance
            </button>
          </div>
        </div>

        {/* Customers Download */}
        <div className="card p-6 border-violet-200 shadow-sm relative overflow-hidden group flex flex-col h-full">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-violet-50 rounded-full transition-transform group-hover:scale-110" />
          <HiOutlineUsers className="relative w-8 h-8 text-violet-600 mb-4" />
          <h3 className="relative text-lg font-bold text-slate-800 mb-2">Customer Export</h3>
          <p className="relative text-sm text-slate-500 mb-6 flex-grow">Download your complete customer database as a CSV file, ready for email marketing or SMS campaigns.</p>
          
          <div className="relative space-y-4 mt-auto">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="input-label mb-2 block">Date Range</label>
                <DateFilter 
                  isRange 
                  dateFrom={startDateCust} 
                  setDateFrom={setStartDateCust} 
                  dateTo={endDateCust} 
                  setDateTo={setEndDateCust} 
                />
              </div>
            </div>
            <button
              onClick={() => handleDownload('customers')}
              disabled={loading}
              className="btn-primary w-full bg-gradient-to-r from-violet-600 to-purple-500 shadow-violet-500/20 hover:shadow-violet-500/30 flex items-center justify-center gap-2"
            >
              <HiOutlineDownload className="w-5 h-5" /> Export Customers Data
            </button>
          </div>
        </div>

        {/* Expenses Download */}
        <div className="card p-6 border-rose-200 shadow-sm relative overflow-hidden group flex flex-col h-full">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50 rounded-full transition-transform group-hover:scale-110" />
          <HiOutlineDocumentText className="relative w-8 h-8 text-rose-600 mb-4" />
          <h3 className="relative text-lg font-bold text-slate-800 mb-2">Expense Export</h3>
          <p className="relative text-sm text-slate-500 mb-6 flex-grow">Download a complete list of all recorded expenses within a selected date range.</p>
          
          <div className="relative space-y-4 mt-auto">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="input-label mb-2 block">Date Range</label>
                <DateFilter 
                  isRange 
                  dateFrom={startDateExp} 
                  setDateFrom={setStartDateExp} 
                  dateTo={endDateExp} 
                  setDateTo={setEndDateExp} 
                />
              </div>
            </div>
            <button
              onClick={() => handleDownload('expenses')}
              disabled={loading}
              className="btn-primary w-full bg-gradient-to-r from-rose-500 to-red-500 shadow-rose-500/20 hover:shadow-rose-500/30 flex items-center justify-center gap-2"
            >
              <HiOutlineDownload className="w-5 h-5" /> Export Expenses Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
