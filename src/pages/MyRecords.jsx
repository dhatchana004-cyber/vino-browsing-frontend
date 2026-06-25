import { useState } from 'react';
import { useEntries, useUpdateEntryStatus, useServices } from '../hooks/useApi';
import StatusBadge, { STATUS_LABELS } from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineDocumentSearch, HiOutlineX, HiOutlineLockClosed, HiOutlinePencilAlt } from 'react-icons/hi';
import DateFilter from '../components/ui/DateFilter';
import { useAuth } from '../contexts/AuthContext';
import EditEntryModal from '../components/ui/EditEntryModal';
import { getLocalDateString } from '../utils/date';

export default function MyRecords() {
  const { user, isOwner } = useAuth();
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({ search: '', has_srn: '', service: '', date_from: getLocalDateString(), date_to: getLocalDateString(), status: '', page: 1 });
  const { data, isLoading } = useEntries(
    Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
  );
  const { data: servicesData } = useServices();
  const updateStatus = useUpdateEntryStatus();

  const services = servicesData?.results || servicesData || [];
  const entries = data?.results || [];
  const totalPages = Math.ceil((data?.count || 0) / 20);

  const canEdit = (entry) => {
    if (isOwner) return true;
    const serviceName = (entry.service_name || '').toLowerCase();
    const isPanService = serviceName.includes('pan new') || serviceName.includes('pan correction') || serviceName.includes('pan ') || serviceName === 'pan';
    
    if (user?.permissions?.includes('edit_records')) {
      return isPanService;
    }
    return false;
  };

  const handleClearFilters = () => {
    setFilters({ search: '', has_srn: '', service: '', date_from: getLocalDateString(), date_to: getLocalDateString(), status: '', page: 1 });
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">My Records</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">{data?.count || 0} total entries</p>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text" className="input pl-10"
              placeholder="Search name/SRN..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            />
          </div>

          <select className="select w-auto min-w-[150px]" value={filters.service}
            onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value, page: 1 }))}>
            <option value="">All Services</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <DateFilter
            isRange
            dateFrom={filters.date_from}
            setDateFrom={(val) => setFilters(prev => ({ ...prev, date_from: val, page: 1 }))}
            dateTo={filters.date_to}
            setDateTo={(val) => setFilters(prev => ({ ...prev, date_to: val, page: 1 }))}
          />



          <label className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              checked={filters.has_srn === 'true'}
              onChange={(e) => setFilters(prev => ({ ...prev, has_srn: e.target.checked ? 'true' : '', page: 1 }))}
            />
            SRN Only
          </label>
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Customer</th><th>Service</th>
                  <th>SRN</th><th>Amount</th><th>Charge</th><th>Profit</th>
                  <th>Status</th><th>Update</th><th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                          <HiOutlineDocumentSearch className="w-8 h-8 text-slate-300" strokeWidth={1} />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No records found</p>
                      </div>
                    </td>
                  </tr>
                ) : entries.map((entry, idx) => (
                  <tr key={entry.id}>
                    <td className="text-slate-400">{(filters.page - 1) * 20 + idx + 1}</td>
                    <td className="text-slate-500 font-medium">{entry.date}</td>
                    <td className="font-bold text-slate-800">{entry.customer_name || '-'}</td>
                    <td className="font-medium text-slate-700">{entry.service_name}</td>
                    <td className="text-brand-600 font-mono text-xs">{entry.srn_number || '-'}</td>
                    <td className="font-bold text-slate-800">₹{entry.amount}</td>
                    <td className="text-slate-500 font-medium">₹{entry.charge}</td>
                    <td className="text-success-text font-bold">₹{entry.profit}</td>
                    <td><StatusBadge status={entry.status} /></td>
                    <td>
                      <select
                        className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1.5 text-slate-700 font-semibold focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                        value={entry.status}
                        onChange={(e) => {
                          updateStatus.mutate({ id: entry.id, status: e.target.value }, {
                            onSuccess: () => toast.success('Status updated'),
                            onError: () => toast.error('Update failed'),
                          });
                        }}
                      >
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td>
                      {canEdit(entry) ? (
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit Record"
                        >
                          <HiOutlinePencilAlt className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="p-1.5 text-slate-300 flex items-center justify-center" title="Editing locked">
                          <HiOutlineLockClosed className="w-4 h-4" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button className="btn-secondary text-sm px-4 py-2 disabled:opacity-50" disabled={filters.page <= 1}
            onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
          <span className="text-sm font-semibold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">Page {filters.page} of {totalPages}</span>
          <button className="btn-secondary text-sm px-4 py-2 disabled:opacity-50" disabled={filters.page >= totalPages}
            onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next</button>
        </div>
      )}

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}
