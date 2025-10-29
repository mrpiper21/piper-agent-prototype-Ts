import { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, useAuthStore } from '../features/auth';
import LoadingScreen from '../shared/components/LoadingScreen';

const ClerkLayout = lazy(() => import('../features/clerk/layouts/ClerkLayout'));
const DashboardPage = lazy(() => import('../features/clerk/pages/DashboardPage'));
const JobsPage = lazy(() => import('../features/clerk/pages/JobsPage'));
const SubmitPage = lazy(() => import('../features/clerk/pages/SubmitPage'));
const StatusPage = lazy(() => import('../features/clerk/pages/StatusPage'));
const ProfilePage = lazy(() => import('../features/clerk/pages/ProfilePage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RoleBasedRoute() {
  // const user = useAuthStore((state) => state.user);

  // if (user?.role === 'admin') {
  //   return <AdminDashboard />;
  // }

  return <Navigate to="/clerk/dashboard" replace />;
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleBasedRoute />} />
          <Route
            path="/clerk"
            element={<ProtectedRoute><ClerkLayout /></ProtectedRoute>}
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="submit" element={<SubmitPage />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
