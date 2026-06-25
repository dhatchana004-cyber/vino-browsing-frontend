import { useState } from 'react';
import { useStaffList, useUpdateStaff } from '../hooks/useApi';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { HiOutlineUserAdd, HiOutlineTrash, HiOutlineCheck, HiOutlineX, HiOutlinePencil, HiOutlineLogout } from 'react-icons/hi';
import { confirmAction } from '../utils/confirmToast';

export default function StaffManagement() {
  const { data: staff, isLoading, refetch } = useStaffList();
  const updateStaff = useUpdateStaff();
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', first_name: '' });

  const openEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setForm({ username: staffMember.username, password: '', first_name: staffMember.first_name || '' });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingStaff(null);
    setForm({ username: '', password: '', first_name: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        const updateData = { first_name: form.first_name, username: form.username };
        // If password is provided, we can reset it via the separate endpoint or patch it
        // Since we didn't add password to patch, let's use reset-password if provided
        await updateStaff.mutateAsync({ id: editingStaff.id, ...updateData });
        if (form.password) {
          await api.post(`/staff/${editingStaff.id}/reset-password/`, { new_password: form.password });
        }
        toast.success('Staff member updated');
      } else {
        await api.post('/staff/', form);
        toast.success('Staff member created');
      }
      setShowModal(false);
      refetch();
    } catch {
      toast.error(editingStaff ? 'Failed to update staff' : 'Failed to create staff');
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await api.patch(`/staff/${id}/`, { is_active: !isActive });
      toast.success(isActive ? 'Staff deactivated' : 'Staff activated');
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteStaff = async (id) => {
    confirmAction('Delete this staff member completely?', async () => {
      try {
        await api.delete(`/staff/${id}/`);
        toast.success('Staff deleted');
        refetch();
      } catch {
        toast.error('Failed to delete');
      }
    });
  };

  const forceLogout = async (id) => {
    confirmAction('Force logout this staff member?', async () => {
      try {
        await api.post(`/staff/${id}/logout/`);
        toast.success('Staff logged out successfully');
        refetch();
      } catch {
        toast.error('Failed to logout staff');
      }
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Management</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage employee accounts and access</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <HiOutlineUserAdd className="w-5 h-5" /> Add Staff
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff?.map(s => (
            <div key={s.id} className="card relative group">
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => s.is_online && forceLogout(s.id)} 
                  className={`btn-icon ${s.is_online ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700' : 'text-rose-500 hover:bg-rose-50 hover:text-rose-600'}`} 
                  title={s.is_online ? "Force Logout (Online)" : "Offline (Cannot Logout)"}
                >
                  <HiOutlineLogout className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toggleStatus(s.id, s.is_active)}
                  className={`btn-icon ${s.is_active ? 'text-success-text hover:bg-success-bg' : 'text-slate-400 hover:text-success-text hover:bg-success-bg'}`}
                  title={s.is_active ? 'Deactivate' : 'Activate'}
                >
                  {s.is_active ? <HiOutlineCheck className="w-5 h-5" /> : <HiOutlineX className="w-5 h-5" />}
                </button>
                <button onClick={() => openEdit(s)} className="btn-icon text-slate-400 hover:text-brand-600 hover:bg-brand-50" title="Edit">
                  <HiOutlinePencil className="w-5 h-5" />
                </button>
                <button onClick={() => deleteStaff(s.id)} className="btn-icon text-slate-400 hover:text-danger-text hover:bg-danger-bg" title="Delete">
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 font-bold text-xl flex items-center justify-center border-2 border-brand-100 shadow-sm overflow-hidden">
                  {s.profile_photo ? (
                    <img src={s.profile_photo} alt={s.username} className="w-full h-full object-cover" />
                  ) : (
                    s.first_name?.[0] || s.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 leading-tight">{s.first_name || s.username}</h3>
                  <p className="text-sm font-medium text-slate-500">@{s.username}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className={`badge ${s.is_active ? 'bg-success-bg text-success-text border border-success-border' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Role</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">{editingStaff ? 'Edit Staff Member' : 'New Staff Member'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon text-slate-400"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Full Name</label>
                <input type="text" className="input" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Username</label>
                <input type="text" className="input" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
              </div>
              <div>
                <label className="input-label">{editingStaff ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input type="text" className="input" required={!editingStaff} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary w-full mt-2" disabled={updateStaff.isPending}>
                {editingStaff ? 'Save Changes' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
