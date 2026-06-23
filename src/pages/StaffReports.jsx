import { useState } from 'react';
import { useDailyReport } from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function StaffReports() {
  const [tab, setTab] = useState('Today');
  
  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const lastDate = new Date(year, now.getMonth() + 1, 0).getDate();
  
  const todayStr = `${year}-${monthStr}-${d}`;
  const monthStartStr = `${year}-${monthStr}-01`;
  const monthEndStr = `${year}-${monthStr}-${lastDate}`;

  let actualFrom, actualTo, displayTitle;
  
  if (tab === 'Today') {
    actualFrom = todayStr;
    actualTo = todayStr;
    displayTitle = "Today's Performance";
  } else if (tab === 'Current Month') {
    actualFrom = monthStartStr;
    actualTo = monthEndStr;
    displayTitle = `Performance for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  }

  const daily = useDailyReport(actualFrom, actualTo);

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Reports</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">{displayTitle}</p>
      </div>

      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner-soft border border-slate-200">
        {['Today', 'Current Month'].map(t => (
          <button key={t}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${tab === t ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            onClick={() => setTab(t)}>{t}</button>
        ))}
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
      </div>
    </div>
  );
}
