import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { LandingPage } from '@/pages/LandingPage';
import { ChatWorkspace } from '@/pages/ChatWorkspace';
import { UpgradePage } from '@/pages/UpgradePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
// Heavy admin/analytics surfaces are lazy-loaded so the landing & chat
// bundles stay slim.
const UserDashboard = lazy(() =>
  import('@/pages/UserDashboard').then((m) => ({ default: m.UserDashboard }))
);
const AdminDashboard = lazy(() =>
  import('@/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
import { DocsPage } from '@/pages/DocsPage';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useTheme } from '@/hooks/useTheme';
import { useStore } from '@/store/useStore';

function LazyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-indigo-500" />
    </div>
  );
}

function Bootstrap() {
  const { session } = useSupabaseAuth();
  const setUser = useStore((s) => s.setUser);

  useEffect(() => {
    if (session?.user) {
      void setUser(session.user.id, null);
    } else {
      void setUser(null, null);
    }
  }, [session?.user, setUser]);

  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function App() {
  // Initialize theme globally
  useTheme();

  return (
    <>
      <ScrollToTop />
      <Bootstrap />
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatWorkspace />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

function SettingsRoute() {
  return <Navigate to="/chat?settings=1" replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useSupabaseAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-indigo-500" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, role } = useSupabaseAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-indigo-500" />
      </div>
    );
  }
  if (!isAuthenticated || role !== 'admin') {
    return <Navigate to="/chat" replace />;
  }
  return <>{children}</>;
}

export default App;