import { useState, useEffect } from 'react';
import { useServices, useUpdateEntry, useStaffList } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineX, HiOutlineCurrencyRupee, HiOutlineUser, HiOutlinePhone, HiOutlineHashtag } from 'react-icons/hi';
import { STATUS_LABELS } from './StatusBadge';

export default function EditEntryModal({ entry, onClose }) {
  const { user, isOwner } = useAuth();
  const { data: servicesData } = useServices();
  const { data: staffList } = useStaffList();
  const updateEntry = useUpdateEntry();

  const services = servicesData?.results || servicesData || [];

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    service: '',
    staff: '',
    srn_number: '',
    amount: '',
    charge: '',
    status: '',
  });

  useEffect(() => {
    if (entry) {
      setForm({
        customer_name: entry.customer_name || '',
        phone: entry.phone || '',
        service: entry.service || '',
        staff: entry.staff || '',
        srn_number: entry.srn_number || '',
        amount: entry.amount || '',
        charge: entry.charge || '',
        status: entry.status || '',
      });
    }
  }, [entry]);

  if (!entry) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only include staff and sensitive fields if the current user is an owner, to prevent unauthorized edits
      const dataToSubmit = { ...form };
      if (!isOwner) {
        delete dataToSubmit.staff;
        delete dataToSubmit.amount;
        delete dataToSubmit.charge;
        delete dataToSubmit.status;
      }
      
      await updateEntry.mutateAsync({ id: entry.id, data: dataToSubmit });
      toast.success('Entry updated successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update entry');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Record</h2>
            <p className="text-sm text-slate-500">Update details for this service entry</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Customer Details</h3>
                
                <div>
                  <label className="input-label">Customer Name</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      className="input pl-10" 
                      required 
                      value={form.customer_name}
                      onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Phone Number</label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      className="input pl-10" 
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Service Details</h3>
                
                <div>
                  <label className="input-label">Service Type</label>
                  <select 
                    className="select" 
                    required 
                    value={form.service}
                    onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                  >
                    <option value="">Select Service...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {isOwner && (
                  <div>
                    <label className="input-label">Assigned Staff</label>
                    <select 
                      className="select" 
                      value={form.staff}
                      onChange={e => setForm(p => ({ ...p, staff: e.target.value }))}
                    >
                      <option value="">Select Staff...</option>
                      {staffList?.map(s => (
                        <option key={s.id} value={s.id}>{s.first_name || s.username}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="input-label">SRN Number</label>
                  <div className="relative">
                    <HiOutlineHashtag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      className="input pl-10" 
                      value={form.srn_number}
                      onChange={e => setForm(p => ({ ...p, srn_number: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Owner Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="input-label">Amount (₹)</label>
                    <div className="relative">
                      <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        step="0.01"
                        className="input pl-10" 
                        value={form.amount}
                        onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Charge (₹)</label>
                    <div className="relative">
                      <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        step="0.01"
                        className="input pl-10" 
                        value={form.charge}
                        onChange={e => setForm(p => ({ ...p, charge: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Status</label>
                    <select 
                      className="select" 
                      value={form.status}
                      onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-secondary px-6"
            disabled={updateEntry.isPending}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="edit-form" 
            className="btn-primary px-8"
            disabled={updateEntry.isPending}
          >
            {updateEntry.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}
