import { useState, useRef, useEffect } from 'react';
import {
  useSiteSettings, useUpdateSiteSettings,
  useWhyChooseUsPoints, useCreateWhyChooseUsPoint, useUpdateWhyChooseUsPoint, useDeleteWhyChooseUsPoint,
  usePublicServices, useCreatePublicService, useUpdatePublicService, useDeletePublicService,
  useJobUpdates, useCreateJobUpdate, useUpdateJobUpdate, useDeleteJobUpdate,
  useEducationApps, useCreateEducationApp, useUpdateEducationApp, useDeleteEducationApp,
} from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineGlobe, HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlinePlus, HiOutlineTrash, HiOutlinePencilAlt, HiOutlineCheck,
  HiOutlineX, HiOutlineCamera, HiOutlineSpeakerphone, HiOutlineHome,
  HiOutlineStar, HiOutlineViewGrid, HiOutlineBriefcase, HiOutlinePhone,
  HiOutlinePhotograph, HiOutlineSave,
} from 'react-icons/hi';

// ============ Accordion Section ============
function AccordionSection({ icon: Icon, title, emoji, children, isOpen, onToggle }) {
  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{emoji}</span>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
        </div>
        {isOpen ? <HiOutlineChevronUp className="w-5 h-5 text-slate-400" /> : <HiOutlineChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {isOpen && <div className="px-5 pb-5 border-t border-slate-100 pt-5">{children}</div>}
    </div>
  );
}

// ============ Top Bar + Header + Footer (Settings Form) ============
function SettingsSection({ openSection, toggleSection }) {
  const { data, isLoading } = useSiteSettings();
  const update = useUpdateSiteSettings();
  const [form, setForm] = useState({});
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);
  const heroInputRef = useRef(null);

  useEffect(() => {
    if (data) {
      setForm({ ...data });
      if (data.hero_photo) setHeroPreview(data.hero_photo);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleHeroPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select an image file'); return; }
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  const handleSave = async (section) => {
    try {
      if (heroFile) {
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (k !== 'hero_photo' && v !== null && v !== undefined) formData.append(k, v);
        });
        formData.append('hero_photo', heroFile);
        await update.mutateAsync(formData);
        setHeroFile(null);
      } else {
        const payload = { ...form };
        delete payload.hero_photo;
        await update.mutateAsync(payload);
      }
      toast.success(`${section} saved!`);
    } catch {
      toast.error('Failed to save');
    }
  };

  const tags = form.hero_service_tags ? form.hero_service_tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  const addTag = (tag) => {
    const newTags = [...tags, tag];
    handleChange('hero_service_tags', newTags.join(', '));
  };

  const removeTag = (idx) => {
    const newTags = tags.filter((_, i) => i !== idx);
    handleChange('hero_service_tags', newTags.join(', '));
  };

  return (
    <>
      {/* Top Bar */}
      <AccordionSection emoji="📢" title="Top Bar" isOpen={openSection === 'settings-top'} onToggle={() => toggleSection('settings-top')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Address</label>
            <textarea className="input min-h-[80px]" value={form.address || ''} onChange={e => handleChange('address', e.target.value)} placeholder="Shop address..." />
          </div>
          <div>
            <label className="input-label">Working Hours</label>
            <input className="input" value={form.hours || ''} onChange={e => handleChange('hours', e.target.value)} placeholder="e.g. 9 AM – 9 PM" />
          </div>
          <div>
            <label className="input-label">Holiday</label>
            <input className="input" value={form.holiday || ''} onChange={e => handleChange('holiday', e.target.value)} placeholder="e.g. Sunday" />
          </div>
        </div>
        <button onClick={() => handleSave('Top Bar')} disabled={update.isPending} className="btn-primary mt-4 px-6">
          {update.isPending ? 'Saving...' : 'Save Top Bar'}
        </button>
      </AccordionSection>

      {/* Header */}
      <AccordionSection emoji="🏠" title="Header" isOpen={openSection === 'settings-header'} onToggle={() => toggleSection('settings-header')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Shop Name</label>
            <input className="input" value={form.shop_name || ''} onChange={e => handleChange('shop_name', e.target.value)} placeholder="VINO Browsing Center" />
          </div>
          <div>
            <label className="input-label">Community Link</label>
            <input className="input" value={form.community_link || ''} onChange={e => handleChange('community_link', e.target.value)} placeholder="https://chat.whatsapp.com/..." />
          </div>
          <div>
            <label className="input-label">WhatsApp Number</label>
            <input className="input" value={form.whatsapp || ''} onChange={e => handleChange('whatsapp', e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>
        </div>
        <button onClick={() => handleSave('Header')} disabled={update.isPending} className="btn-primary mt-4 px-6">
          {update.isPending ? 'Saving...' : 'Save Header'}
        </button>
      </AccordionSection>

      {/* Hero Section */}
      <AccordionSection emoji="🎯" title="Hero Section" isOpen={openSection === 'settings-hero'} onToggle={() => toggleSection('settings-hero')}>
        <div className="space-y-4">
          <div>
            <label className="input-label">Hero Title</label>
            <input className="input" value={form.hero_title || ''} onChange={e => handleChange('hero_title', e.target.value)} placeholder="Your One-Stop Service Center" />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="input-label">Hero Photo</label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => heroInputRef.current?.click()}
                className="w-40 h-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors overflow-hidden"
              >
                {heroPreview ? (
                  <img src={heroPreview} alt="Hero" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <HiOutlinePhotograph className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">Upload</span>
                  </div>
                )}
              </div>
              <input ref={heroInputRef} type="file" className="hidden" accept="image/*" onChange={handleHeroPhoto} />
              {heroPreview && (
                <button
                  onClick={() => { setHeroPreview(null); setHeroFile(null); handleChange('hero_photo', null); }}
                  className="text-sm text-red-500 hover:text-red-700 font-semibold"
                >Remove</button>
              )}
            </div>
          </div>

          {/* Service Tags */}
          <div>
            <label className="input-label">Service Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold">
                  {tag}
                  <button onClick={() => removeTag(idx)} className="text-brand-400 hover:text-red-500">
                    <HiOutlineX className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <TagInput onAdd={addTag} />
          </div>
        </div>
        <button onClick={() => handleSave('Hero Section')} disabled={update.isPending} className="btn-primary mt-4 px-6">
          {update.isPending ? 'Saving...' : 'Save Hero Section'}
        </button>
      </AccordionSection>

      {/* Footer / Contact */}
      <AccordionSection emoji="📞" title="Footer / Contact" isOpen={openSection === 'settings-footer'} onToggle={() => toggleSection('settings-footer')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Email</label>
            <input className="input" type="email" value={form.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="info@vinobrowsing.com" />
          </div>
          <div>
            <label className="input-label">Google Map URL</label>
            <input className="input" value={form.map_url || ''} onChange={e => handleChange('map_url', e.target.value)} placeholder="https://maps.google.com/..." />
          </div>
          <div>
            <label className="input-label">Instagram Link</label>
            <input className="input" value={form.instagram_link || ''} onChange={e => handleChange('instagram_link', e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className="input-label">YouTube Link</label>
            <input className="input" value={form.youtube_link || ''} onChange={e => handleChange('youtube_link', e.target.value)} placeholder="https://youtube.com/..." />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">Address and contact links are shared with the Top Bar & Header sections above.</p>
        <button onClick={() => handleSave('Footer')} disabled={update.isPending} className="btn-primary mt-4 px-6">
          {update.isPending ? 'Saving...' : 'Save Footer'}
        </button>
      </AccordionSection>
    </>
  );
}

// ============ Tag Input helper ============
function TagInput({ onAdd }) {
  const [value, setValue] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue('');
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input className="input flex-1" value={value} onChange={e => setValue(e.target.value)} placeholder="Add a tag..." />
      <button type="submit" className="btn-primary px-4 py-2 flex items-center gap-1">
        <HiOutlinePlus className="w-4 h-4" /> Add
      </button>
    </form>
  );
}

// ============ Why Choose Us Section ============
function WhyChooseUsSection({ isOpen, onToggle }) {
  const { data: points, isLoading } = useWhyChooseUsPoints();
  const createPoint = useCreateWhyChooseUsPoint();
  const updatePoint = useUpdateWhyChooseUsPoint();
  const deletePoint = useDeleteWhyChooseUsPoint();
  
  const [newText, setNewText] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    try {
      await createPoint.mutateAsync({ text: newText.trim(), order: (points?.length || 0) + 1 });
      setNewText('');
      toast.success('Point added');
    } catch { toast.error('Failed to add'); }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setEditText(p.text);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    try {
      await updatePoint.mutateAsync({ id: editId, text: editText.trim() });
      setEditId(null);
      setEditText('');
      toast.success('Point updated');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    try {
      await deletePoint.mutateAsync(id);
      toast.success('Point removed');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <AccordionSection emoji="⭐" title="Why Choose Us" isOpen={isOpen} onToggle={onToggle}>
      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {points?.map((p, idx) => (
            <div key={p.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              {editId === p.id ? (
                <form onSubmit={handleUpdate} className="flex gap-2">
                  <input autoFocus className="input flex-1" value={editText} onChange={e => setEditText(e.target.value)} />
                  <button type="submit" disabled={updatePoint.isPending} className="btn-primary px-3 py-1.5 flex items-center gap-1 text-sm">
                    <HiOutlineSave className="w-4 h-4" /> Save
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="btn-secondary px-3 py-1.5 text-sm">
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    <span className="font-medium text-slate-700">{p.text}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                      <HiOutlinePencilAlt className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <form onSubmit={handleAdd} className="flex gap-2 mt-2">
            <input className="input flex-1" value={newText} onChange={e => setNewText(e.target.value)} placeholder="Add a new point..." />
            <button type="submit" disabled={createPoint.isPending} className="btn-primary px-4 py-2 flex items-center gap-1">
              <HiOutlinePlus className="w-4 h-4" /> Add
            </button>
          </form>
        </div>
      )}
    </AccordionSection>
  );
}

// ============ Services Section ============
function ServicesSection({ isOpen, onToggle }) {
  const { data: services, isLoading } = usePublicServices();
  const createService = useCreatePublicService();
  const updateService = useUpdatePublicService();
  const deleteService = useDeletePublicService();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', icon: '', order: 0, is_active: true });

  const resetForm = () => { setForm({ title: '', description: '', icon: '', order: 0, is_active: true }); setEditId(null); setShowForm(false); };

  const handleEdit = (svc) => {
    setForm({ title: svc.title, description: svc.description, icon: svc.icon, order: svc.order, is_active: svc.is_active });
    setEditId(svc.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    try {
      if (editId) {
        await updateService.mutateAsync({ id: editId, ...form });
        toast.success('Service updated');
      } else {
        await createService.mutateAsync({ ...form, order: (services?.length || 0) + 1 });
        toast.success('Service added');
      }
      resetForm();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try { await deleteService.mutateAsync(id); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  return (
    <AccordionSection emoji="🏷️" title="Our Services" isOpen={isOpen} onToggle={onToggle}>
      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services?.map(svc => (
              <div key={svc.id} className={`p-4 rounded-xl border ${svc.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'} flex flex-col`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{svc.icon || '📋'}</span>
                    <h4 className="font-bold text-slate-800 text-sm">{svc.title}</h4>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(svc)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                      <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(svc.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{svc.description || 'No description'}</p>
                {!svc.is_active && <span className="text-[10px] font-bold text-red-500 uppercase mt-2">Hidden</span>}
              </div>
            ))}
          </div>

          {/* Add / Edit Form */}
          {showForm ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700 text-sm">{editId ? 'Edit Service' : 'Add New Service'}</h4>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input className="input" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                  <input className="input" placeholder="Icon (emoji)" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 cursor-pointer text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 text-brand-600 rounded" />
                    Active
                  </label>
                </div>
                <textarea className="input min-h-[60px]" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary px-5 py-2 flex items-center gap-1">
                    <HiOutlineCheck className="w-4 h-4" /> {editId ? 'Update' : 'Add Service'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2">Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="btn-secondary w-full py-3 flex items-center justify-center gap-2 border-dashed">
              <HiOutlinePlus className="w-5 h-5" /> Add Service
            </button>
          )}
        </div>
      )}
    </AccordionSection>
  );
}

// ============ Job Updates Section ============
function JobUpdatesSection({ isOpen, onToggle }) {
  const { data: jobs, isLoading } = useJobUpdates();
  const createJob = useCreateJobUpdate();
  const updateJob = useUpdateJobUpdate();
  const deleteJob = useDeleteJobUpdate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const initialForm = { 
    title: '', exam_name: '', post_count: '', qualification: '', 
    description: '', start_date: '', end_date: '', 
    exam_date: '', last_date: '', is_active: true 
  };
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);

  const resetForm = () => { 
    setForm(initialForm); 
    setEditId(null); 
    setShowAddForm(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (job) => {
    if (editId === job.id) {
      resetForm();
      return;
    }
    setForm({ 
      title: job.title || '', 
      exam_name: job.exam_name || '', 
      post_count: job.post_count || '', 
      qualification: job.qualification || '', 
      description: job.description || '', 
      start_date: job.start_date || '', 
      end_date: job.end_date || '', 
      exam_date: job.exam_date || '', 
      last_date: job.last_date || '', 
      is_active: job.is_active 
    });
    setEditId(job.id);
    setImageFile(null);
    setImagePreview(job.image || null);
    setShowAddForm(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Job Title is required'); return; }
    
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') formData.append(k, v);
    });
    if (imageFile) formData.append('image', imageFile);

    try {
      if (editId) {
        await updateJob.mutateAsync({ id: editId, data: formData });
        toast.success('Job updated');
      } else {
        await createJob.mutateAsync(formData);
        toast.success('Job added');
      }
      resetForm();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try { await deleteJob.mutateAsync(id); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const renderForm = (isEditing) => (
    <div className={`p-4 bg-slate-50 border border-slate-200 ${isEditing ? 'border-t-0 rounded-b-xl' : 'rounded-xl mt-3'} space-y-3`}>
      <h4 className="font-bold text-slate-700 text-sm">{isEditing ? 'Edit Job' : 'Add New Job'}</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Main Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Job Title</label>
            <input className="input w-full" placeholder="e.g. TNPSC Group 4" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Exam Name</label>
            <input className="input w-full" placeholder="e.g. Group 4" value={form.exam_name} onChange={e => setForm(f => ({ ...f, exam_name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Post Count</label>
            <input className="input w-full" placeholder="e.g. 1500+" value={form.post_count} onChange={e => setForm(f => ({ ...f, post_count: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Qualification</label>
            <input className="input w-full" placeholder="e.g. Any Degree" value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Exam Date</label>
            <input className="input w-full text-sm" type="date" value={form.exam_date} onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Last Date</label>
            <input className="input w-full text-sm" type="date" value={form.last_date} onChange={e => setForm(f => ({ ...f, last_date: e.target.value }))} />
          </div>
        </div>

        {/* Image & Description */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="text-xs text-slate-500 font-medium mb-1 block">Job Image</label>
            <div className="flex items-center gap-3">
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="w-20 h-20 rounded-lg bg-white border border-dashed border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden hover:border-brand-400"
              >
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <HiOutlinePhotograph className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-xs text-red-500 font-medium hover:underline">
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="col-span-2 flex flex-col">
            <label className="text-xs text-slate-500 font-medium mb-1 block">Description</label>
            <textarea className="input flex-1 min-h-[80px]" placeholder="Optional description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 text-brand-600 rounded" />
            Active
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-1.5 text-sm">Cancel</button>
            <button type="submit" className="btn-primary px-4 py-1.5 text-sm flex items-center gap-1">
              <HiOutlineCheck className="w-4 h-4" /> {isEditing ? 'Update' : 'Add Job'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <AccordionSection emoji="💼" title="Job Updates" isOpen={isOpen} onToggle={onToggle}>
      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {/* Job List */}
          {jobs?.length > 0 ? (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="flex flex-col shadow-sm">
                  <div className={`flex items-center justify-between p-4 border ${job.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'} ${editId === job.id ? 'rounded-t-xl border-b-0 bg-slate-50' : 'rounded-xl'}`}>
                    <div className="flex items-start gap-4">
                      {job.image && (
                        <img src={job.image} alt={job.title} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                      )}
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{job.title}</div>
                        {job.exam_name && <div className="text-xs font-semibold text-slate-600">{job.exam_name}</div>}
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          {job.qualification && <span><span className="font-semibold text-slate-600">Qual:</span> {job.qualification}</span>}
                          {job.post_count && <span><span className="font-semibold text-slate-600">Posts:</span> {job.post_count}</span>}
                          {job.last_date && <span><span className="font-semibold text-pink-600">Last Date:</span> {job.last_date}</span>}
                          {job.exam_date && <span><span className="font-semibold text-indigo-600">Exam Date:</span> {job.exam_date}</span>}
                        </div>
                        {job.description && <div className="text-xs text-slate-500 mt-1">{job.description.substring(0, 80)}{job.description.length > 80 ? '...' : ''}</div>}
                        {!job.is_active && <span className="text-[10px] font-bold text-red-500 uppercase mt-1 inline-block">Hidden</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(job)} className={`p-2 rounded-lg transition-colors ${editId === job.id ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}>
                        <HiOutlinePencilAlt className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(job.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Inline Edit Form */}
                  {editId === job.id && renderForm(true)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No job updates yet</div>
          )}

          {/* Add New Button / Form */}
          {!editId && (
            showAddForm ? renderForm(false) : (
              <button onClick={() => setShowAddForm(true)} className="btn-secondary w-full py-3 flex items-center justify-center gap-2 border-dashed mt-2">
                <HiOutlinePlus className="w-5 h-5" /> Add Job Update
              </button>
            )
          )}
        </div>
      )}
    </AccordionSection>
  );
}

// ============ Education Applications Section ============
function EducationApplicationsSection({ isOpen, onToggle }) {
  const { data: apps, isLoading } = useEducationApps();
  const createApp = useCreateEducationApp();
  const updateApp = useUpdateEducationApp();
  const deleteApp = useDeleteEducationApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ exam_name: '', exam_date: '', last_date: '', is_active: true });

  const resetForm = () => { 
    setForm({ exam_name: '', exam_date: '', last_date: '', is_active: true }); 
    setEditId(null); 
    setShowAddForm(false); 
  };

  const handleEdit = (app) => {
    if (editId === app.id) {
      resetForm();
      return;
    }
    setForm({ exam_name: app.exam_name, exam_date: app.exam_date || '', last_date: app.last_date || '', is_active: app.is_active });
    setEditId(app.id);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.exam_name.trim()) { toast.error('Exam Name is required'); return; }
    try {
      if (editId) {
        await updateApp.mutateAsync({ id: editId, ...form });
        toast.success('Application updated');
      } else {
        await createApp.mutateAsync(form);
        toast.success('Application added');
      }
      resetForm();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try { await deleteApp.mutateAsync(id); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const renderForm = (isEditing) => (
    <div className={`p-4 bg-slate-50 border border-slate-200 ${isEditing ? 'border-t-0 rounded-b-xl' : 'rounded-xl mt-3'} space-y-3`}>
      <h4 className="font-bold text-slate-700 text-sm">{isEditing ? 'Edit Application' : 'Add New Application'}</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="input" placeholder="Exam Name" value={form.exam_name} onChange={e => setForm(f => ({ ...f, exam_name: e.target.value }))} required />
          <div className="flex items-center gap-2">
            <input className="input w-full text-xs" type="date" value={form.exam_date} onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))} title="Exam Date (optional)" />
          </div>
          <div className="flex items-center gap-2">
            <input className="input w-full text-xs" type="date" value={form.last_date} onChange={e => setForm(f => ({ ...f, last_date: e.target.value }))} title="Last Date (optional)" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 text-brand-600 rounded" />
            Active
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-1.5 text-sm">Cancel</button>
            <button type="submit" className="btn-primary px-4 py-1.5 text-sm flex items-center gap-1">
              <HiOutlineCheck className="w-4 h-4" /> {isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <AccordionSection emoji="🎓" title="Education Applications" isOpen={isOpen} onToggle={onToggle}>
      {isLoading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {apps?.length > 0 ? (
            <div className="space-y-3">
              {apps.map(app => (
                <div key={app.id} className="flex flex-col shadow-sm">
                  <div className={`flex items-center justify-between p-4 border ${app.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'} ${editId === app.id ? 'rounded-t-xl border-b-0 bg-slate-50' : 'rounded-xl'}`}>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{app.exam_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {app.exam_date && <span className="font-medium text-indigo-600">Exam: {app.exam_date}</span>} 
                        {app.last_date && <span className="font-medium text-pink-600 ml-2">Last Date: {app.last_date}</span>}
                      </div>
                      {!app.is_active && <span className="text-[10px] font-bold text-red-500 uppercase mt-1 inline-block">Hidden</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(app)} className={`p-2 rounded-lg transition-colors ${editId === app.id ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}>
                        <HiOutlinePencilAlt className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(app.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {editId === app.id && renderForm(true)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No education applications yet</div>
          )}

          {!editId && (
            showAddForm ? renderForm(false) : (
              <button onClick={() => setShowAddForm(true)} className="btn-secondary w-full py-3 flex items-center justify-center gap-2 border-dashed mt-2">
                <HiOutlinePlus className="w-5 h-5" /> Add Application
              </button>
            )
          )}
        </div>
      )}
    </AccordionSection>
  );
}

// ============ Main Page ============
export default function PublicSiteSettings() {
  const [openSection, setOpenSection] = useState('settings-top');

  const toggleSection = (sectionName) => {
    setOpenSection(prev => prev === sectionName ? null : sectionName);
  };

  return (
    <div className="space-y-4 animate-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <HiOutlineGlobe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Public Site</h2>
          <p className="text-sm font-medium text-slate-500">Manage your public website content</p>
        </div>
      </div>

      <SettingsSection openSection={openSection} toggleSection={toggleSection} />
      <WhyChooseUsSection isOpen={openSection === 'why-choose-us'} onToggle={() => toggleSection('why-choose-us')} />
      <ServicesSection isOpen={openSection === 'services'} onToggle={() => toggleSection('services')} />
      <JobUpdatesSection isOpen={openSection === 'jobs'} onToggle={() => toggleSection('jobs')} />
      <EducationApplicationsSection isOpen={openSection === 'education'} onToggle={() => toggleSection('education')} />
    </div>
  );
}
