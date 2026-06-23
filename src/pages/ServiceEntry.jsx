import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useServices, useCreateEntry, useCustomerLookup, useStaffList } from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineSave, HiOutlinePlus, HiOutlineRefresh, HiOutlineCheckCircle } from 'react-icons/hi';

const initialForm = {
  phone: '',
  customer_name: '',
  service: '',
  staff: '',
  amount: '',
  charge: '',
  srn_number: '',
  remarks: '',
  document: null,
};

export default function ServiceEntry() {
  const { user, isOwner } = useAuth();
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const { data: staffData } = useStaffList();
  const createEntry = useCreateEntry();
  const customerLookup = useCustomerLookup();

  const [form, setForm] = useState({ ...initialForm, staff: isOwner ? '' : user?.id });
  const [profit, setProfit] = useState(0);
  const [isReturning, setIsReturning] = useState(false);
  const [savedEntries, setSavedEntries] = useState([]);
  const documentInputRef = useRef(null);

  const services = servicesData?.results || servicesData || [];
  const staff = staffData ? [...staffData] : [];
  
  if (isOwner && user) {
    if (!staff.find(s => s.id === user.id)) {
      staff.unshift({ id: user.id, username: user.username, full_name: `${user.full_name || 'Owner'} (You)` });
    }
  }

  // Auto-calculate profit
  useEffect(() => {
    const amount = parseFloat(form.amount) || 0;
    const charge = parseFloat(form.charge) || 0;
    setProfit(amount - charge);
  }, [form.amount, form.charge]);

  // Customer auto-lookup on phone change (debounced)
  useEffect(() => {
    if (form.phone.length >= 10) {
      const timer = setTimeout(() => {
        customerLookup.mutate(form.phone, {
          onSuccess: (data) => {
            const results = data.results || data;
            if (results.length > 0) {
              const customer = results[0];
              setForm(prev => ({ ...prev, customer_name: customer.name }));
              setIsReturning(true);
            } else {
              setIsReturning(false);
            }
          },
        });
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsReturning(false);
    }
  }, [form.phone]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (addMore = false) => {
    if (!form.service) {
      toast.error('Please select a service type');
      return;
    }
    if (!form.customer_name) {
      toast.error('Please enter customer name');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('customer_name', form.customer_name);
      formData.append('phone', form.phone);
      formData.append('service', form.service);
      formData.append('staff', isOwner ? (form.staff || user.id) : user.id);
      formData.append('amount', form.amount || 0);
      formData.append('charge', form.charge || 0);
      formData.append('srn_number', form.srn_number);
      formData.append('remarks', form.remarks);
      if (form.document) {
        formData.append('document', form.document);
      }

      const result = await createEntry.mutateAsync(formData);
      toast.success('Entry saved successfully!');

      if (addMore) {
        setSavedEntries(prev => [result, ...prev]);
        // Keep phone for multi-entry session and focus service select
        setForm({
          ...initialForm,
          phone: form.phone,
          customer_name: form.customer_name,
          staff: form.staff,
        });
        setTimeout(() => document.getElementById('service-select')?.focus(), 100);
      } else {
        setForm({ ...initialForm, staff: isOwner ? '' : user?.id });
        setIsReturning(false);
      }
      
      // Clear the file input visually
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save entry';
      toast.error(msg);
    }
  };

  const handleClear = () => {
    setForm({ ...initialForm, staff: isOwner ? '' : user?.id });
    setIsReturning(false);
    setSavedEntries([]);
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  if (servicesLoading) return <LoadingSpinner text="Loading services..." />;

  return (
    <div className="max-w-4xl mx-auto animate-in space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Service Entry</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Add new service entry for a customer</p>
      </div>

      {/* Entry Form */}
      <div className="card space-y-6 p-6 sm:p-8">
        {/* Customer Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="input-label">Customer Name</label>
            <input
              type="text"
              className="input"
              placeholder="Enter customer name"
              value={form.customer_name}
              onChange={(e) => updateField('customer_name', e.target.value)}
              id="customer-name-input"
            />
          </div>
          <div>
            <label className="input-label">Phone Number (Optional)</label>
            <div className="relative">
              <input
                type="tel"
                className="input"
                placeholder="Enter 10-digit mobile"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                id="phone-input"
              />
              {isReturning && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="text-xs bg-success-bg text-success-text px-2 py-1 rounded-full font-semibold border border-success-border">
                    Returning
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Staff Selector (Owner only) */}
        {isOwner && (
          <div>
            <label className="input-label">Assign to Staff</label>
            <select
              className="select"
              value={form.staff}
              onChange={(e) => updateField('staff', e.target.value)}
              id="staff-select"
            >
              <option value="">Select staff member</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name || s.username}</option>
              ))}
            </select>
          </div>
        )}

        {/* Service Type */}
        <div>
          <label className="input-label">Service Type *</label>
          <select
            className="select"
            value={form.service}
            onChange={(e) => updateField('service', e.target.value)}
            id="service-select"
          >
            <option value="">Select service type</option>
            {services.map((s) => {
              const isRestricted = !isOwner && (s.name.toLowerCase().includes('pan new') || s.name.toLowerCase().includes('pan correction') || s.name.toLowerCase().includes('pan ')) && !user?.permissions?.includes('edit_records');
              return (
                <option key={s.id} value={s.id} disabled={isRestricted}>
                  {s.name} {isRestricted ? '🔒 (Locked)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Amount Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="input-label">Amount Paid (₹)</label>
            <input
              type="number"
              className="input font-medium"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => updateField('amount', e.target.value)}
              min="0"
              step="0.01"
              id="amount-input"
            />
          </div>
          <div>
            <label className="input-label">Cost / Charge (₹)</label>
            <input
              type="number"
              className="input font-medium"
              placeholder="0.00"
              value={form.charge}
              onChange={(e) => updateField('charge', e.target.value)}
              min="0"
              step="0.01"
              id="charge-input"
            />
          </div>
          <div>
            <label className="input-label">Net Profit (₹)</label>
            <div className={`input bg-slate-100 cursor-not-allowed font-bold text-lg border-transparent flex items-center ${profit >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
              ₹{profit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* SRN + Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="input-label">SRN Number (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="Service Request Number"
              value={form.srn_number}
              onChange={(e) => updateField('srn_number', e.target.value)}
              id="srn-input"
            />
          </div>
          <div>
            <label className="input-label">Document Upload</label>
            <input
              type="file"
              ref={documentInputRef}
              className="input p-[7px] text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold file:px-4 file:py-1.5 file:text-sm file:cursor-pointer hover:file:bg-brand-100 file:transition-colors"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => updateField('document', e.target.files[0])}
              id="document-input"
            />
          </div>
        </div>

        <div>
          <label className="input-label">Remarks</label>
          <textarea
            className="textarea"
            placeholder="Additional notes..."
            value={form.remarks}
            onChange={(e) => updateField('remarks', e.target.value)}
            rows={2}
            id="remarks-input"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={createEntry.isPending}
              className="btn-secondary flex items-center gap-2"
              id="add-more-btn"
            >
              <HiOutlinePlus className="w-5 h-5" />
              Save & Add Another
            </button>
            <button
              onClick={handleClear}
              className="btn-secondary flex items-center gap-2 border-transparent hover:border-slate-300"
              id="clear-btn"
            >
              <HiOutlineRefresh className="w-5 h-5" />
              Clear
            </button>
          </div>
          
          <button
            onClick={() => handleSubmit(false)}
            disabled={createEntry.isPending}
            className="btn-primary flex items-center gap-2 px-8"
            id="save-entry-btn"
          >
            <HiOutlineSave className="w-5 h-5" />
            {createEntry.isPending ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* Saved Entries This Session */}
      {savedEntries.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500"></span> Saved This Session ({savedEntries.length})
          </h3>
          <div className="space-y-2">
            {savedEntries.map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                <span className="font-medium text-slate-700">{entry.customer_name} — <span className="text-slate-500 font-normal">{entry.service_name}</span></span>
                <span className="text-success-text font-bold">₹{entry.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
