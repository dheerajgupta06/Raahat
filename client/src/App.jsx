import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage.jsx';
import { ResultsPage } from './pages/ResultsPage.jsx';
import { HospitalPage } from './pages/HospitalPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { SOSModal } from './components/SOSModal.jsx';
import { Toaster } from './components/ui/Toaster.jsx';

/** Keeps route changes predictable and makes /#triage style links work. */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = decodeURIComponent(hash.slice(1));
      let frames = 0;
      let timer;
      const reveal = () => {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        frames += 1;
        if (frames < 40) timer = window.requestAnimationFrame(reveal);
      };
      timer = window.requestAnimationFrame(reveal);
      return () => window.cancelAnimationFrame(timer);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return undefined;
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hospitals" element={<ResultsPage />} />
        <Route path="/hospital/:id" element={<HospitalPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <SOSModal />
      <Toaster />
    </>
  );
}
