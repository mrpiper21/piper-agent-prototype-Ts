import { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth';
import LoadingScreen from '../shared/components/LoadingScreen';

const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard'));
const ClerkDashboard = lazy(() => import('../features/clerk/ClerkDashboard'));
const Login = lazy(() => import('../features/auth/pages/LoginPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RoleBasedRoute() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <ClerkDashboard />;
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedRoute />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}
