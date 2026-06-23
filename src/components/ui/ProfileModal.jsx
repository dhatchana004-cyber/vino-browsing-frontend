import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateProfile, useDeleteProfilePhoto } from '../../hooks/useApi';
import { HiOutlineX, HiOutlineCamera, HiOutlineUser, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { confirmAction } from '../../utils/confirmToast';

export default function ProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const deleteProfilePhoto = useDeleteProfilePhoto();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(user?.profile_photo || null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profile_photo', selectedFile);

    try {
      const updatedUser = await updateProfile.mutateAsync(formData);
      // Update auth context with new user data
      updateUser(updatedUser);
      
      toast.success('Profile photo updated successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile photo');
    }
  };

  const handleDeletePhoto = async () => {
    confirmAction('Are you sure you want to delete your profile photo?', async () => {
      try {
        const updatedUser = await deleteProfilePhoto.mutateAsync();
        updateUser(updatedUser);
        setPreview(null);
        setSelectedFile(null);
        toast.success('Profile photo deleted');
      } catch (err) {
        toast.error('Failed to delete profile photo');
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">My Profile</h2>
            <p className="text-xs text-slate-500">Update your details</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full bg-brand-50 border-4 border-brand-100 flex items-center justify-center overflow-hidden shadow-sm transition-all duration-300 group-hover:border-brand-300">
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <HiOutlineUser className="w-10 h-10 text-brand-300" />
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <HiOutlineCamera className="w-6 h-6 text-white mb-1" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/jpeg,image/png,image/webp" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="text-center w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-1">{user?.full_name || user?.username}</h3>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider bg-brand-100 inline-block px-2 py-0.5 rounded">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-2xl animate-fade-in">
          <div>
            {!selectedFile && user?.profile_photo && (
              <button 
                type="button" 
                onClick={handleDeletePhoto}
                className="text-danger-text hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
                disabled={deleteProfilePhoto.isPending || updateProfile.isPending}
              >
                <HiOutlineTrash className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
          
          {selectedFile ? (
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setPreview(user?.profile_photo || null);
                  setSelectedFile(null);
                }} 
                className="btn-secondary px-4 py-2"
                disabled={updateProfile.isPending}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleUpload}
                className="btn-primary px-6 py-2"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Saving...' : 'Save Photo'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary px-4 py-2">
                Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
