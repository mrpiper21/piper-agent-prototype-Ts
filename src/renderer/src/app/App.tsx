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
const UserManagementPage = lazy(() => import('../features/clerk/pages/UserManagementPage'));
const ServicesPage = lazy(() => import('../features/clerk/pages/ServicesPage'));
const SetupLocationPage = lazy(() => import('../features/auth/pages/SetupLocationPage'));
const SetupPasswordPage = lazy(() => import('../features/auth/pages/SetupPasswordPage'));
const BusinessInfoPage = lazy(() => import('../features/auth/pages/BusinessInfoPage'));
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

// Route guard for setup business - allows access if user exists but is not authenticated (business info pending)
function SetupBusinessRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Allow access if user exists but not authenticated (business info setup required)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is already authenticated (has location), redirect to dashboard
  if (isAuthenticated && user.location) {
    return <Navigate to="/" replace />;
  }

  // If business info is already set, redirect to location setup
  if (user.businessName && user.businessPhone) {
    return <Navigate to="/setup-location" replace />;
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
                <SetupPasswordRoute>
                  <SetupPasswordPage />
                </SetupPasswordRoute>
              }
            />
            <Route
              path="/setup-business"
              element={
                <SetupBusinessRoute>
                  <BusinessInfoPage />
                </SetupBusinessRoute>
              }
            />
            <Route
              path="/setup-location"
              element={
                <SetupLocationRoute>
                  <SetupLocationPage />
                </SetupLocationRoute>
              }
            />
            <Route path="/" element={<RoleBasedRoute />} />
            <Route
              path="/clerk"
              element={
                <ProtectedRoute>
                  <ClerkLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="submit" element={<SubmitPage />} />
              <Route path="status" element={<StatusPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="user-management" element={<UserManagementPage />} />
              <Route path="services" element={<ServicesPage />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}
