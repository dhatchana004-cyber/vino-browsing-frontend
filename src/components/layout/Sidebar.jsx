import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineHome,
  HiOutlinePlusCircle,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineDownload,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineCog,
  HiOutlineUserGroup,
  HiOutlineX,
  HiOutlineLogout,
  HiOutlineGlobe,
} from 'react-icons/hi';

const ownerNav = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/entry', label: 'Service Entry', icon: HiOutlinePlusCircle },
  { to: '/records', label: 'All Records', icon: HiOutlineClipboardList },
  { to: '/reports', label: 'Reports', icon: HiOutlineChartBar },
  { to: '/download', label: 'Data Download', icon: HiOutlineDownload },
  { to: '/attendance', label: 'Staff Attendance', icon: HiOutlineClock },
  { to: '/staff', label: 'Staff Management', icon: HiOutlineUserGroup },
  { to: '/services', label: 'Service Settings', icon: HiOutlineCog },
  { to: '/settings', label: 'Owner Settings', icon: HiOutlineCog },
  { to: '/customers', label: 'Customers', icon: HiOutlineUsers },
  { to: '/public-site', label: 'Public Site', icon: HiOutlineGlobe },
];

const staffNav = [
  { to: '/entry', label: 'Service Entry', icon: HiOutlinePlusCircle },
  { to: '/my-records', label: 'My Records', icon: HiOutlineClipboardList },
  { to: '/staff-reports', label: 'Staff Reports', icon: HiOutlineChartBar },
  { to: '/customers', label: 'Customers', icon: HiOutlineUsers },
];

export default function Sidebar({ isOpen, onClose }) {
  const { isOwner, logout } = useAuth();
  const location = useLocation();
  const navItems = isOwner ? ownerNav : staffNav;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-100 shadow-sm
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-pink flex items-center justify-center font-bold text-white text-lg shadow-md shadow-brand-500/20">
              V
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">VINO</h1>
              <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">Browsing Center</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon lg:hidden">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-1 h-[calc(100%-5rem)]">
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                <div className="text-sm">{item.label}</div>
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to logout?')) {
                  await logout();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-danger-bg text-danger-text hover:bg-red-100 transition-colors text-sm font-bold"
            >
              <HiOutlineLogout className="w-5 h-5" strokeWidth={2} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
