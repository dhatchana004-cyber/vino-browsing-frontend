import { useState } from 'react';
import { useDashboard, useCreateExpense, useDeleteExpense, useSaveOpeningBalance, useApproveLogin, useRejectLogin } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getLocalDateString } from '../utils/date';
import toast from 'react-hot-toast';
import { HiOutlineCurrencyRupee, HiOutlineTrendingUp, HiOutlineUserGroup, HiOutlinePlus, HiOutlineSave, HiOutlineDocumentSearch } from 'react-icons/hi';

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();
  const { isOwner } = useAuth();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const saveBalance = useSaveOpeningBalance();
  const approveLogin = useApproveLogin();
  const rejectLogin = useRejectLogin();

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceSaved, setBalanceSaved] = useState(false);

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <div className="text-danger-text text-center py-12">Failed to load dashboard</div>;

  const today = getLocalDateString();

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    try {
      await createExpense.mutateAsync({
        title: expenseTitle,
        amount: parseFloat(expenseAmount),
        date: today,
      });
      setExpenseTitle('');
      setExpenseAmount('');
      toast.success('Expense added');
    } catch {
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await deleteExpense.mutateAsync(id);
        toast.success('Expense deleted');
      } catch {
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleSaveBalance = async () => {
    try {
      await saveBalance.mutateAsync({
        date: today,
        amount: parseFloat(openingBalance) || 0,
      });
      setBalanceSaved(true);
      toast.success('Opening balance saved');
    } catch {
      toast.error('Failed to save balance');
    }
  };


  const onlineStaff = data.staff_status?.filter(s => s.is_working) || [];
  const offlineStaff = data.staff_status?.filter(s => !s.is_working) || [];

  return (
    <div className="space-y-8 animate-in">
      {/* Page Title & Pending Logins */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Today's overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Summary row moved to top */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="card text-center py-6 bg-gradient-to-br from-white to-slate-50">
          <div className="text-3xl font-bold text-brand-600">{data.total_entries}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Total Entries</div>
        </div>
        <div className="card text-center py-6 bg-gradient-to-br from-white to-slate-50">
          <div className="text-3xl font-bold text-blue-600">{data.total_customers}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Customers</div>
        </div>
        <div className="card text-center py-6 bg-gradient-to-br from-white to-slate-50">
          <div className="text-3xl font-bold text-success-text">₹{Number(data.opening_balance).toLocaleString('en-IN')}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Opening Balance</div>
        </div>
      </div>

      {isOwner && data.pending_logins?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Pending Staff Logins ({data.pending_logins.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.pending_logins.map((req) => (
              <div key={req.id} className="bg-white border border-amber-100 rounded-lg p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                    {req.staff_name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{req.staff_name}</div>
                    <div className="text-xs font-medium text-slate-500">Requesting login...</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => approveLogin.mutate(req.id)}
                    disabled={approveLogin.isPending}
                    className="flex-1 py-1.5 bg-success-text text-white rounded-md text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectLogin.mutate(req.id)}
                    disabled={rejectLogin.isPending}
                    className="flex-1 py-1.5 bg-rose-100 text-rose-600 rounded-md text-xs font-bold hover:bg-rose-200 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Opening Balance Input (Top, above grid) */}
      {isOwner && (
        <div className="card mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500"></span>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider m-0">Opening Balance</h3>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="number"
              className="input w-full sm:w-48"
              placeholder="₹ Amount"
              value={openingBalance || data.opening_balance || ''}
              onChange={(e) => { setOpeningBalance(e.target.value); setBalanceSaved(false); }}
            />
            <button onClick={handleSaveBalance} className="btn-primary px-4 shadow-none" disabled={saveBalance.isPending}>
              <HiOutlineSave className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Expenses (Left column) */}
        {isOwner && (
          <div className="card flex flex-col h-[450px]">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Today Expenses
              </h3>
              <form onSubmit={handleAddExpense} className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Expense Title"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                />
                <input
                  type="number"
                  className="input w-24"
                  placeholder="₹"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
                <button type="submit" className="btn-primary px-4 shadow-none" disabled={createExpense.isPending}>
                  <HiOutlinePlus className="w-5 h-5" />
                </button>
              </form>
              {data.total_expenses > 0 && (
                <div className="text-sm font-medium text-slate-500 pt-3 border-t border-slate-100 flex justify-between">
                  <span>Total Expenses:</span>
                  <span className="text-rose-600 font-bold text-base">₹{Number(data.total_expenses).toLocaleString('en-IN')}</span>
                </div>
              )}
              {data.expenses?.length > 0 && (
                <div className="mt-3 space-y-2 overflow-y-auto flex-1 pr-1">
                  {data.expenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                      <span className="font-medium text-slate-700">{exp.title}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-rose-500">₹{exp.amount}</span>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Expense"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Staff Status (Middle column) */}
        {isOwner && data.staff_status?.length > 0 && (
          <div className="card flex flex-col h-[450px]">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Staff Status
            </h3>
            
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* Online Staff */}
              {onlineStaff.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-success-text uppercase tracking-wider mb-2 px-1">Online ({onlineStaff.length})</h4>
                <div className="space-y-2">
                  {onlineStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs border border-brand-200 overflow-hidden shadow-sm">
                            {staff.profile_photo ? (
                              <img src={staff.profile_photo} alt={staff.name} className="w-full h-full object-cover" />
                            ) : (
                              staff.name[0].toUpperCase()
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-success-text" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{staff.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-slate-500">{staff.entries_count} entries</span>
                        <span className="text-success-text font-bold">₹{staff.total_amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Staff */}
            {offlineStaff.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1 mt-4">Not Work ({offlineStaff.length})</h4>
                <div className="space-y-2">
                  {offlineStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 opacity-75"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs border border-slate-200 overflow-hidden shadow-sm grayscale opacity-70">
                            {staff.profile_photo ? (
                              <img src={staff.profile_photo} alt={staff.name} className="w-full h-full object-cover" />
                            ) : (
                              staff.name[0].toUpperCase()
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-slate-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-500">{staff.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="text-slate-400">Offline</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Recent Entries (Right column) */}
        <div className="card lg:col-span-1 flex flex-col h-[450px]">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Recent Entries
          </h3>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {data.recent_entries?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                  <HiOutlineDocumentSearch className="w-8 h-8 text-slate-300" strokeWidth={1} />
                </div>
                <p className="text-sm font-medium text-slate-400">No entries today</p>
                <p className="text-xs text-slate-400 mt-1">New service entries will appear here.</p>
              </div>
            ) : (
              data.recent_entries?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-2 p-3.5 rounded-xl bg-white border border-slate-100 hover:border-brand-200 hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-slate-800">{entry.customer_name || 'Unknown Customer'}</div>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">{entry.service_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800 text-base">₹{entry.amount}</div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-50">
                    <StatusBadge status={entry.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
