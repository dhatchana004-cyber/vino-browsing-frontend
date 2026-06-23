import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServiceEntry from './pages/ServiceEntry';
import AllRecords from './pages/AllRecords';
import MyRecords from './pages/MyRecords';
import Reports from './pages/Reports';
import StaffReports from './pages/StaffReports';
import DataDownload from './pages/DataDownload';
import StaffAttendance from './pages/StaffAttendance';
import StaffManagement from './pages/StaffManagement';
import ServiceSettings from './pages/ServiceSettings';
import OwnerSettings from './pages/OwnerSettings';
import Customers from './pages/Customers';
import PublicSiteSettings from './pages/PublicSiteSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Verifying session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'owner' ? '/dashboard' : '/entry'} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Loading..." />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'owner' ? '/dashboard' : '/entry'} replace /> : <Login />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Owner routes */}
        <Route path="/dashboard" element={<ProtectedRoute requiredRole="owner"><Dashboard /></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute requiredRole="owner"><AllRecords /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute requiredRole="owner"><Reports /></ProtectedRoute>} />
        <Route path="/download" element={<ProtectedRoute requiredRole="owner"><DataDownload /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute requiredRole="owner"><StaffAttendance /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute requiredRole="owner"><StaffManagement /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute requiredRole="owner"><ServiceSettings /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requiredRole="owner"><OwnerSettings /></ProtectedRoute>} />
        <Route path="/public-site" element={<ProtectedRoute requiredRole="owner"><PublicSiteSettings /></ProtectedRoute>} />

        {/* Staff routes */}
        <Route path="/my-records" element={<ProtectedRoute requiredRole="staff"><MyRecords /></ProtectedRoute>} />
        <Route path="/staff-reports" element={<ProtectedRoute requiredRole="staff"><StaffReports /></ProtectedRoute>} />

        {/* Shared routes */}
        <Route path="/entry" element={<ServiceEntry />} />
        <Route path="/customers" element={<Customers />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'owner' ? '/dashboard' : '/entry') : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a2742',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              },
              success: {
                iconTheme: { primary: '#00e676', secondary: '#0f1729' },
              },
              error: {
                iconTheme: { primary: '#f44336', secondary: '#0f1729' },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
