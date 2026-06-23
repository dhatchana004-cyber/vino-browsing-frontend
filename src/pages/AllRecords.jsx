import { useState } from 'react';
import { useEntries, useUpdateEntryStatus, useServices, useStaffList } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge, { STATUS_LABELS } from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { HiOutlineSearch, HiOutlineDownload, HiOutlineX, HiOutlinePencilAlt, HiOutlineLockClosed } from 'react-icons/hi';
import DateFilter from '../components/ui/DateFilter';
import EditEntryModal from '../components/ui/EditEntryModal';
import { getLocalDateString } from '../utils/date';

export default function AllRecords() {
  const { user, isOwner } = useAuth();
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    service: '',
    staff: '',
    status: '',
    date_from: getLocalDateString(),
    date_to: getLocalDateString(),
    page: 1,
  });

  const { data, isLoading } = useEntries(
    Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
  );
  const { data: servicesData } = useServices();
  const { data: staffData } = useStaffList();
  const updateStatus = useUpdateEntryStatus();

  const services = servicesData?.results || servicesData || [];
  const staff = staffData || [];
  const entries = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  const canEdit = (entry) => {
    if (isOwner) return true;
    const serviceName = (entry.service_name || '').toLowerCase();
    const isRestricted = serviceName.includes('pan new') || serviceName.includes('pan correction') || serviceName.includes('pan ');
    if (isRestricted) {
      return user?.permissions?.includes('edit_records');
    }
    return true;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleClearFilters = () => {
    setFilters({ search: '', service: '', staff: '', status: '', date_from: getLocalDateString(), date_to: getLocalDateString(), page: 1 });
  };

  const handleDownload = async () => {
    try {
      const params = {};
      if (filters.date_from) params.start_date = filters.date_from;
      if (filters.date_to) params.end_date = filters.date_to;

      const response = await api.get('/download/daily/', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `VINO_Records_${filters.date_from ? `${filters.date_from}_to_${filters.date_to}` : 'all'}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">All Records</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">{totalCount} total entries</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownload} className="btn-secondary flex items-center gap-2">
            <HiOutlineDownload className="w-5 h-5 text-brand-600" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              className="input pl-10"
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
          {isOwner && (
            <select className="select w-auto min-w-[150px]" value={filters.staff}
              onChange={(e) => setFilters(prev => ({ ...prev, staff: e.target.value, page: 1 }))}>
              <option value="">All Staff</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.full_name || s.username}</option>)}
            </select>
          )}
          <select className="select w-auto min-w-[150px]" value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}>
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <DateFilter
            isRange
            dateFrom={filters.date_from}
            setDateFrom={(val) => setFilters(prev => ({ ...prev, date_from: val, page: 1 }))}
            dateTo={filters.date_to}
            setDateTo={(val) => setFilters(prev => ({ ...prev, date_to: val, page: 1 }))}
          />
        </div>
      </div>

      {/* Records Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Service</th>
                  <th>SRN</th>
                  <th>Doc</th>
                  <th>Amount</th>
                  <th>Charge</th>
                  <th>Profit</th>
                  <th>Status</th>
                  {isOwner && <th>Staff</th>}
                  <th>Update</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={isOwner ? 14 : 13} className="text-center py-12 text-slate-400">
                      <div className="font-medium text-base">No records found</div>
                      <div className="text-sm mt-1">Try adjusting your filters</div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => (
                    <tr key={entry.id}>
                      <td className="text-slate-400">{(filters.page - 1) * 20 + idx + 1}</td>
                      <td className="text-slate-500 font-medium">{entry.date}</td>
                      <td className="font-bold text-slate-800">{entry.customer_name || '-'}</td>
                      <td className="text-slate-500">{entry.phone || '-'}</td>
                      <td className="font-medium text-slate-700">{entry.service_name}</td>
                      <td className="text-brand-600 font-mono text-xs">{entry.srn_number || '-'}</td>
                      <td>
                        {entry.document ? (
                          <a href={entry.document} target="_blank" rel="noopener noreferrer" className="p-1.5 inline-flex text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors" title="View Document">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="font-bold text-slate-800">₹{entry.amount}</td>
                      <td className="text-slate-500 font-medium">₹{entry.charge}</td>
                      <td className="text-success-text font-bold">₹{entry.profit}</td>
                      <td><StatusBadge status={entry.status} /></td>
                      {isOwner && <td className="text-slate-500 font-medium">{entry.staff_name}</td>}
                      <td>
                        <select
                          className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1.5 text-slate-700 font-semibold focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                          value={entry.status}
                          onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
            disabled={filters.page <= 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            Page {filters.page} of {totalPages}
          </span>
          <button
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
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
