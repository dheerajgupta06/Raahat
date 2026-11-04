import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ToastStack from './components/ToastStack.jsx';
import { useAdmin } from './context/AdminContext.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import ApprovalsPage from './pages/ApprovalsPage.jsx';
import HospitalsPage from './pages/HospitalsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-console">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-accent/20 ring-1 ring-accent/40" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">Loading control room</p>
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { token, booting } = useAdmin();
  if (booting) return <Splash />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/hospitals" element={<HospitalsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastStack />
    </>
  );
}
