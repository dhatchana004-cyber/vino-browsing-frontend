import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineCloud,
  HiOutlineClock,
} from 'react-icons/hi';
import { useTodayAttendance } from '../../hooks/useApi';
import ProfileModal from '../ui/ProfileModal';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { data: attendanceData } = useTodayAttendance();
  const [time, setTime] = useState(new Date());
  const [synced, setSynced] = useState(true);
  const [workingSeconds, setWorkingSeconds] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate live accumulated working time for staff
  useEffect(() => {
    if (user?.role !== 'staff' || !attendanceData) return;
    
    const calculateTime = () => {
      let total = 0;
      const now = new Date();
      attendanceData.forEach(record => {
        if (record.staff !== user.id) return;
        const login = new Date(record.login_time);
        const logout = record.logout_time ? new Date(record.logout_time) : now;
        total += Math.max(0, logout - login);
      });
      setWorkingSeconds(Math.floor(total / 1000));
    };

    calculateTime(); // initial calculation
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [user, attendanceData]);

  // Simulate cloud sync indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setSynced(false);
      setTimeout(() => setSynced(true), 1500);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });

  const formatDate = (d) =>
    d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });

  const formatDuration = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 lg:px-8 flex items-center justify-between shadow-sm">
      {/* Left: Menu + Page title */}
      <div className="flex items-center gap-4 w-1/3">
        <button
          onClick={onMenuClick}
          className="btn-icon lg:hidden"
          id="sidebar-toggle"
        >
          <HiOutlineMenu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <p className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">vinobrowsing.com</p>
        </div>
      </div>

      {/* Center: Live Clock (Monospaced, highly readable) */}
      <div className="hidden md:flex flex-col items-center justify-center w-1/3">
        <div className="text-[1.1rem] font-mono font-bold tracking-wider text-slate-800">
          {formatTime(time)}
        </div>
        <div className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(time)}</div>
      </div>

      {/* Right: Sync + User + Logout */}
      <div className="flex items-center justify-end gap-5 w-1/3">
        {/* Cloud Sync */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100" title={synced ? 'Synced' : 'Syncing...'}>
          <HiOutlineCloud
            className={`w-4 h-4 transition-colors duration-300 ${
              synced ? 'text-success-text' : 'text-warning-text animate-pulse'
            }`}
            strokeWidth={2}
          />
          <span className="text-xs font-semibold text-slate-500">
            {synced ? 'Synced' : 'Syncing...'}
          </span>
        </div>

        {/* Staff Working Time */}
        {user?.role === 'staff' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100" title="Today's Working Time">
            <HiOutlineClock className="w-5 h-5 text-emerald-600" />
            <span className="text-[1.1rem] font-mono font-bold tracking-wider text-emerald-600 leading-none mt-0.5">
              {formatDuration(workingSeconds)}
            </span>
          </div>
        )}

        {/* User info (Polished Avatar) */}
        <div 
          className="flex items-center gap-3 pl-4 border-l border-slate-100 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowProfile(true)}
          title="My Profile"
        >
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.full_name || user?.username}
            </div>
            <div className="text-[11px] font-medium text-brand-600 leading-tight capitalize mt-0.5">
              {user?.role}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-sm font-bold text-brand-600 shadow-sm overflow-hidden">
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              (user?.full_name || user?.username || '?')[0].toUpperCase()
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-icon text-slate-400 hover:text-danger-text hover:bg-danger-bg"
          title="Logout"
          id="logout-btn"
        >
          <HiOutlineLogout className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Profile Modal */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </header>
  );
}
