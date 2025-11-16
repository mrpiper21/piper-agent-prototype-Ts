import { Suspense, lazy, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, useAuthStore } from '../features/auth';
import LoadingScreen from '../shared/components/LoadingScreen';
import { OfflinePage } from '../shared/components/OfflinePage';

const ClerkLayout = lazy(() => import('../features/clerk/layouts/ClerkLayout'));
const DashboardPage = lazy(() => import('../features/clerk/pages/DashboardPage'));
const JobsPage = lazy(() => import('../features/clerk/pages/JobsPage'));
const SubmitPage = lazy(() => import('../features/clerk/pages/SubmitPage'));
const StatusPage = lazy(() => import('../features/clerk/pages/StatusPage'));
const ProfilePage = lazy(() => import('../features/clerk/pages/ProfilePage'));
const UserManagementPage = lazy(() => import('../features/clerk/pages/UserManagementPage'));
const SetupLocationPage = lazy(() => import('../features/auth/pages/SetupLocationPage'));
const SetupPasswordPage = lazy(() => import('../features/auth/pages/SetupPasswordPage'));
import { OfflineBanner } from './../shared/components/OfflineBanner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Route guard for setup password - allows access if user has temporary password
// If isTemporaryPassword is true, user is a clerk and must change password
function SetupPasswordRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Allow access if user exists and has temporary password (clerk)
  if (!user || user.isTemporaryPassword !== true) {
    return <Navigate to="/login" replace />;
  }

  // If user is already authenticated (password already changed), redirect to dashboard
  if (isAuthenticated && user.isTemporaryPassword !== true) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Route guard for setup location - allows access if user exists but is not authenticated (location pending)
function SetupLocationRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Allow access if user exists but not authenticated (location setup required)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is already authenticated (has location), redirect to dashboard
  if (isAuthenticated && user.location) {
    return <Navigate to="/" replace />;
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

// Route wrapper that shows offline page when offline (except for login)
function OfflineRoute({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <OfflinePage />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <OfflineBanner />
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/setup-password"
              element={
                <OfflineRoute>
                  <SetupPasswordRoute>
                    <SetupPasswordPage />
                  </SetupPasswordRoute>
                </OfflineRoute>
              }
            />
            <Route
              path="/setup-location"
              element={
                <OfflineRoute>
                  <SetupLocationRoute>
                    <SetupLocationPage />
                  </SetupLocationRoute>
                </OfflineRoute>
              }
            />
            <Route 
              path="/" 
              element={
                <OfflineRoute>
                  <RoleBasedRoute />
                </OfflineRoute>
              } 
            />
            <Route
              path="/clerk"
              element={
                <OfflineRoute>
                  <ProtectedRoute>
                    <ClerkLayout />
                  </ProtectedRoute>
                </OfflineRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="submit" element={<SubmitPage />} />
              <Route path="status" element={<StatusPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="user-management" element={<UserManagementPage />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}
