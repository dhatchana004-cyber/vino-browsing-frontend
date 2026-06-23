import { useNavigate, useLocation } from 'react-router-dom';
import { usePendingLogins } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineUserAdd } from 'react-icons/hi';

export default function PendingLoginNotification() {
  const { isOwner } = useAuth();
  const { data: pendingLogins } = usePendingLogins();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOwner || !pendingLogins || pendingLogins.length === 0) {
    return null;
  }

  // Hide the notification if we're already on the dashboard, as they can see it there
  if (location.pathname === '/dashboard') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce">
      <button
        onClick={() => navigate('/dashboard')}
        className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 rounded-2xl p-4 flex items-center gap-3 transition-transform hover:scale-105"
      >
        <div className="relative">
          <HiOutlineUserAdd className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></span>
        </div>
        <div className="text-left">
          <div className="text-sm font-bold leading-none mb-1">
            {pendingLogins.length} Pending Login{pendingLogins.length > 1 ? 's' : ''}
          </div>
          <div className="text-xs font-medium text-amber-100 leading-none">
            Click to approve
          </div>
        </div>
      </button>
    </div>
  );
}
