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
  HiOutlineChevronLeft,
  HiOutlineLogout,
  HiOutlineGlobe,
} from 'react-icons/hi';
import { confirmAction } from '../../utils/confirmToast';

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

  const handleNavClick = () => {
    // Only auto-close the sidebar on mobile screens (less than 1024px)
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

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
          fixed top-0 left-0 z-50 h-full bg-white border-r border-slate-100 shadow-sm
          transition-all duration-300 ease-in-out overflow-hidden
          lg:static lg:z-0 flex-shrink-0
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-20'}
        `}
      >
        <div className="w-full h-full flex flex-col">
          {/* Logo */}
          <div className={`flex items-center h-20 border-b border-slate-50 transition-all duration-300 ${isOpen ? 'justify-between px-6' : 'lg:justify-center px-6 justify-between'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-pink flex-shrink-0 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-brand-500/20">
                V
              </div>
              <div className={`transition-opacity duration-200 ${!isOpen ? 'lg:hidden' : ''}`}>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight whitespace-nowrap">VINO</h1>
                <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase whitespace-nowrap">Browsing Center</p>
              </div>
            </div>
            <button onClick={onClose} className={`btn-icon ${!isOpen ? 'lg:hidden' : ''}`}>
              <HiOutlineChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex flex-col flex-1 h-[calc(100%-5rem)] overflow-hidden">
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''} ${!isOpen ? 'lg:justify-center lg:px-0' : ''}`
                  }
                  title={!isOpen ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                  <div className={`text-sm whitespace-nowrap transition-all duration-200 ${!isOpen ? 'lg:hidden' : ''}`}>
                    {item.label}
                  </div>
                </NavLink>
              ))}
            </nav>
            
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={() => {
                  handleNavClick();
                  confirmAction('Are you sure you want to logout?', async () => {
                    await logout();
                  });
                }}
                className={`w-full flex items-center gap-3 py-2.5 rounded-xl bg-danger-bg text-danger-text hover:bg-red-100 transition-colors text-sm font-bold ${isOpen ? 'justify-start px-4' : 'lg:justify-center lg:px-0 justify-start px-4'}`}
                title={!isOpen ? 'Logout' : undefined}
              >
                <HiOutlineLogout className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span className={`whitespace-nowrap transition-all duration-200 ${!isOpen ? 'lg:hidden' : ''}`}>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
