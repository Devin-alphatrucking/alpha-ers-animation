import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useDemo } from './context/DemoContext';
import Layout from './components/Layout';
import { LogoMark } from './components/Brand';
import Dashboard from './pages/Dashboard';
import InboxSimulator from './pages/InboxSimulator';
import Bookings from './pages/Bookings';
import ReviewBooster from './pages/ReviewBooster';
import OutreachKit from './pages/OutreachKit';
import Prospects from './pages/Prospects';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import Welcome from './pages/Welcome';
import Settings from './pages/Settings';
import Leads from './pages/Leads';

function OwnerOnly({ children }) {
  const { owner } = useDemo();
  const location = useLocation();
  if (!owner) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

export default function App() {
  const { loading, error, state } = useDemo();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex flex-col items-center">
          <span className="animate-pulse">
            <LogoMark size={40} />
          </span>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-mute">Opening the desk</p>
        </div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="max-w-md border border-line bg-paper p-8">
          <p className="font-display text-2xl">API is offline</p>
          <p className="mt-2 text-sm text-mute">
            Start both servers from the project root with <code className="bg-canvas px-1">npm run dev</code>, then refresh.
          </p>
          <p className="mt-3 text-xs text-ember">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="welcome" element={<Welcome />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pricing" element={<Pricing />} />
        <Route
          path="leads"
          element={
            <OwnerOnly>
              <Leads />
            </OwnerOnly>
          }
        />
        <Route
          path="settings"
          element={
            <OwnerOnly>
              <Settings />
            </OwnerOnly>
          }
        />
        <Route path="inbox" element={<InboxSimulator />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="reviews" element={<ReviewBooster />} />
        <Route
          path="outreach"
          element={
            <OwnerOnly>
              <OutreachKit />
            </OwnerOnly>
          }
        />
        <Route
          path="prospects"
          element={
            <OwnerOnly>
              <Prospects />
            </OwnerOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
