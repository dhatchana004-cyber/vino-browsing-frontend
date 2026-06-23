import { useState } from 'react';
import api from '../api/axios';
import { useStaffList, useStaffPermissions, useAddStaffPermission, useDeleteStaffPermission } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { HiOutlineKey, HiOutlineLockClosed, HiOutlineUser, HiOutlineTrash } from 'react-icons/hi';

export default function OwnerSettings() {
  const [form, setForm] = useState({ old_password: '', new_password: '' });
  const [reportForm, setReportForm] = useState({ current_password: '', new_password: '' });
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');

  const { data: staffList } = useStaffList();
  const { data: permissionsList } = useStaffPermissions();
  const addPermission = useAddStaffPermission();
  const deletePermission = useDeleteStaffPermission();

  const handleAddPermission = async () => {
    if (!selectedStaff) {
      toast.error('Select a staff member');
      return;
    }
    try {
      await addPermission.mutateAsync({
        staff: selectedStaff,
        permission: 'edit_records'
      });
      toast.success('Permission added successfully');
      setSelectedStaff('');
    } catch (err) {
      toast.error('Failed to add permission or already exists');
    }
  };

  const handleRemovePermission = async (id) => {
    try {
      await deletePermission.mutateAsync(id);
      toast.success('Permission removed');
    } catch (err) {
      toast.error('Failed to remove permission');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/settings/change-password/', form);
      toast.success('Password updated successfully');
      setForm({ old_password: '', new_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleReportPasswordSubmit = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    try {
      await api.post('/settings/reports-password/', reportForm);
      toast.success('Reports password updated successfully');
      setReportForm({ current_password: '', new_password: '' });
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const htmlError = typeof err.response?.data === 'string' ? 'Server returned HTML (500/404)' : '';
      toast.error(detail || htmlError || err.message || 'Failed to update reports password');
    } finally {
      setReportLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Owner Settings</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage your account security</p>
      </div>

      {/* PAN Card Permission Section */}
      <div className="card p-6 border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
            <HiOutlineLockClosed className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Record Edit Permission</h3>
            <p className="text-sm text-slate-500">Only staff in this list can edit their records and update status. Owner always has access.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="input-label">Select Staff</label>
            <div className="flex gap-4">
              <select
                className="select flex-1 border-brand-200"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="">-- Select Staff --</option>
                {staffList?.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name || s.username}</option>
                ))}
              </select>
              <button
                onClick={handleAddPermission}
                disabled={addPermission.isPending || !selectedStaff}
                className="btn-primary bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/20"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Permission List</h4>
            {permissionsList?.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No permissions assigned.</p>
            ) : (
              permissionsList?.map(perm => (
                <div key={perm.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <HiOutlineUser className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 uppercase leading-tight">{perm.staff_name || perm.staff}</p>
                      <p className="text-xs font-medium text-emerald-600">
                        {perm.permission === 'pan_card_entry' ? 'PAN Card Entry + Edit permission' : perm.permission}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePermission(perm.id)}
                    disabled={deletePermission.isPending}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-danger-text hover:bg-danger-bg hover:text-red-700 transition-colors"
                  >
                    <HiOutlineTrash className="w-4 h-4" /> Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <HiOutlineKey className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
            <p className="text-sm text-slate-500">Update your owner account password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">Current Password</label>
            <input type="password" required className="input" value={form.old_password} onChange={e => setForm({ ...form, old_password: e.target.value })} />
          </div>
          <div>
            <label className="input-label">New Password</label>
            <input type="password" required className="input" value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Reports Password Section */}
      <div className="card p-6 sm:p-8 border-purple-200">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <HiOutlineLockClosed className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Reports Password</h3>
            <p className="text-sm text-slate-500">Set a password to protect the Reports page</p>
          </div>
        </div>

        <form onSubmit={handleReportPasswordSubmit} className="space-y-5">
          <div>
            <label className="input-label">Current Reports Password</label>
            <input
              type="password"
              className="input"
              value={reportForm.current_password}
              onChange={e => setReportForm({ ...reportForm, current_password: e.target.value })}
              placeholder="Leave blank if not set"
            />
          </div>
          <div>
            <label className="input-label">New Reports Password</label>
            <input
              type="password"
              className="input"
              value={reportForm.new_password}
              onChange={e => setReportForm({ ...reportForm, new_password: e.target.value })}
              placeholder="Leave blank to remove password"
            />
          </div>
          <button type="submit" disabled={reportLoading} className="btn-primary w-full mt-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-purple-500/20">
            {reportLoading ? 'Updating...' : 'Update Reports Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
