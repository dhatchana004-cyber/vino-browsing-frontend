import { useState } from 'react';
import { useServices } from '../hooks/useApi';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { HiOutlinePlus, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { confirmAction } from '../utils/confirmToast';

export default function ServiceSettings() {
  const { data: servicesData, isLoading, refetch } = useServices();
  const services = servicesData?.results || servicesData || [];
  const [newService, setNewService] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newService.trim()) return;
    try {
      await api.post('/services/', { name: newService });
      setNewService('');
      toast.success('Service added');
      refetch();
    } catch (error) {
      const errorMsg = error.response?.data?.name?.[0] || error.response?.data?.detail || 'Failed to add service';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    confirmAction('Are you sure you want to completely delete this service?', async () => {
      try {
        await api.delete(`/services/${id}/`);
        toast.success('Service deleted');
        refetch();
      } catch {
        toast.error('Failed to delete service. It might be used in existing entries.');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Service Catalog Settings</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage the list of available services</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleAdd} className="flex gap-3 max-w-lg mb-8">
          <input type="text" className="input flex-1" placeholder="New service name..." value={newService} onChange={(e) => setNewService(e.target.value)} />
          <button type="submit" className="btn-primary flex items-center gap-2 shadow-none px-6"><HiOutlinePlus className="w-5 h-5" /> Add</button>
        </form>

        {isLoading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border bg-white border-slate-200 transition-colors hover:border-slate-300">
                <span className="font-semibold text-slate-800">{s.name}</span>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="btn-icon text-danger-text hover:bg-danger-bg hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
