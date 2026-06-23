import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useDailyReport, useMonthlyReport, useYearlyReport, useStaffDailyReport } from '../hooks/useApi';
import { getLocalDateString } from '../utils/date';
import toast from 'react-hot-toast';
import { HiOutlineLockClosed } from 'react-icons/hi';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import DateFilter from '../components/ui/DateFilter';

const TABS = ['Custom Range', 'Monthly', 'Yearly'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ label, value, color = 'text-brand-600', shadow = 'shadow-brand-500/20' }) {
  return (
    <div className={`card-stat hover:-translate-y-1.5 transition-transform duration-300`}>
      <div className={`text-3xl font-bold ${color}`}>₹{Number(value || 0).toLocaleString('en-IN')}</div>
      <div className="text-sm font-medium text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function DailyTab() {
  const [dateFrom, setDateFrom] = useState(getLocalDateString());
  const [dateTo, setDateTo] = useState(getLocalDateString());
  const { data, isLoading } = useDailyReport(dateFrom, dateTo);
  const staffDaily = useStaffDailyReport(dateFrom, dateTo);

  if (isLoading || staffDaily.isLoading) return <LoadingSpinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <DateFilter isRange dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Total Amount" value={data.total_amount} color="text-blue-600" />
        <StatCard label="Charge / Fees" value={data.total_charge} color="text-amber-500" />
        <StatCard label="Profit" value={data.total_profit} color="text-purple-600" />
        <StatCard label="Final Profit" value={data.final_profit} color="text-brand-600" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div className="card text-center py-6">
          <div className="text-3xl font-bold text-slate-800">{data.total_entries}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Entries</div>
        </div>
        <div className="card text-center py-6">
          <div className="text-3xl font-bold text-slate-800">{data.total_customers}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Customers</div>
        </div>
        <div className="card text-center py-6">
          <div className="text-3xl font-bold text-rose-500">₹{Number(data.total_expenses || 0).toLocaleString('en-IN')}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Expenses</div>
        </div>
        <div className="card text-center py-6">
          <div className="text-3xl font-bold text-emerald-500">₹{Number(data.opening_balance || 0).toLocaleString('en-IN')}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Opening Bal</div>
        </div>
      </div>

      {/* Staff Performance */}
      {staffDaily.data?.staff_breakdown?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span> Staff Performance
            </h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Customers Attended</th>
                  <th>Total Amount</th>
                  <th>Total Profit</th>
                </tr>
              </thead>
              <tbody>
                {staffDaily.data.staff_breakdown.map((s, i) => (
                  <tr key={s.staff__id}>
                    <td className="font-bold text-slate-800">
                      {s.staff__first_name || s.staff__username}
                      {i === 0 && <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold">Top</span>}
                    </td>
                    <td className="font-bold text-brand-600">{s.count}</td>
                    <td className="font-medium text-slate-700">₹{Number(s.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="text-success-text font-bold">₹{Number(s.total_profit || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entries table */}
      {data.entries?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Customer</th><th>Service</th><th>Amount</th>
                  <th>Charge</th><th>Profit</th><th>Status</th><th>Staff</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e, i) => (
                  <tr key={e.id}>
                    <td className="text-slate-400">{i + 1}</td>
                    <td className="font-bold text-slate-800">{e.customer_name || '-'}</td>
                    <td className="font-medium text-slate-700">{e.service_name}</td>
                    <td className="font-bold text-slate-800">₹{e.amount}</td>
                    <td className="text-slate-500 font-medium">₹{e.charge}</td>
                    <td className="text-success-text font-bold">₹{e.profit}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td className="text-slate-500 font-medium">{e.staff_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading } = useMonthlyReport(month, year);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <select className="select w-40 font-medium" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" className="input w-32 font-medium" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2030} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Total Amount" value={data.total_amount} color="text-blue-600" />
        <StatCard label="Total Charge" value={data.total_charge} color="text-amber-500" />
        <StatCard label="Total Profit" value={data.total_profit} color="text-brand-600" />
        <div className="card text-center py-6 hover:-translate-y-1.5 transition-transform duration-300">
          <div className="text-3xl font-bold text-slate-800">{data.total_entries}</div>
          <div className="text-sm font-medium text-slate-500 mt-1">Total Entries</div>
        </div>
      </div>

      {/* Daily breakdown */}
      {data.daily_breakdown?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Date</th><th>Entries</th><th>Amount</th><th>Charge</th><th>Profit</th></tr></thead>
              <tbody>
                {data.daily_breakdown.map((d, i) => (
                  <tr key={i}>
                    <td className="font-bold text-slate-700">{d.date}</td>
                    <td className="font-medium text-slate-500">{d.entries_count}</td>
                    <td className="font-bold text-slate-800">₹{Number(d.total_amount).toLocaleString('en-IN')}</td>
                    <td className="text-slate-500 font-medium">₹{Number(d.total_charge).toLocaleString('en-IN')}</td>
                    <td className="text-success-text font-bold">₹{Number(d.total_profit).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function YearlyTab() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data, isLoading } = useYearlyReport(year);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <input type="number" className="input w-32 font-medium" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2020} max={2030} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Yearly Amount" value={data.total_amount} color="text-blue-600" />
        <StatCard label="Yearly Charge" value={data.total_charge} color="text-amber-500" />
        <StatCard label="Yearly Profit" value={data.total_profit} color="text-brand-600" />
        <div className="card text-center py-6 hover:-translate-y-1.5 transition-transform duration-300">
          <div className="text-3xl font-bold text-slate-800">{data.total_entries}</div>
          <div className="text-sm font-medium text-slate-500 mt-1">Total Entries</div>
        </div>
      </div>

      {data.monthly_breakdown?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Month</th><th>Entries</th><th>Amount</th><th>Charge</th><th>Profit</th></tr></thead>
              <tbody>
                {data.monthly_breakdown.map((m, i) => (
                  <tr key={i}>
                    <td className="font-bold text-slate-700">{MONTHS[(m.date__month || 1) - 1]}</td>
                    <td className="font-medium text-slate-500">{m.entries_count}</td>
                    <td className="font-bold text-slate-800">₹{Number(m.total_amount).toLocaleString('en-IN')}</td>
                    <td className="text-slate-500 font-medium">₹{Number(m.total_charge).toLocaleString('en-IN')}</td>
                    <td className="text-success-text font-bold">₹{Number(m.total_profit).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('Custom Range');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if password is required on load
    const checkAuth = async () => {
      try {
        const res = await api.post('/settings/verify-reports-password/', { password: '' });
        if (res.data.success) {
          setIsAuthorized(true);
        }
      } catch (err) {
        // Requires password
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setChecking(true);
    try {
      const res = await api.post('/settings/verify-reports-password/', { password });
      if (res.data.success) {
        setIsAuthorized(true);
        toast.success('Access granted');
      }
    } catch (err) {
      toast.error('Incorrect password');
      setPassword('');
    } finally {
      setChecking(false);
    }
  };

  if (checking && !isAuthorized && !password) {
    return <LoadingSpinner />;
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in">
        <div className="card p-8 max-w-sm w-full text-center space-y-6 shadow-xl border-purple-100">
          <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
            <HiOutlineLockClosed className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Protected Area</h2>
            <p className="text-sm text-slate-500 mt-2">Enter the reports password to continue</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              autoFocus
              className="input text-center text-lg tracking-widest"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={checking}
              className="btn-primary w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-purple-500/20"
            >
              {checking ? 'Verifying...' : 'Unlock Reports'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reports</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Detailed financial and performance reports</p>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner-soft border border-slate-200">
        {TABS.map(t => (
          <button
            key={t}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              tab === t 
                ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Custom Range' && <DailyTab />}
      {tab === 'Monthly' && <MonthlyTab />}
      {tab === 'Yearly' && <YearlyTab />}
    </div>
  );
}
