import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useDemo } from './context/DemoContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InboxSimulator from './pages/InboxSimulator';
import Bookings from './pages/Bookings';
import ReviewBooster from './pages/ReviewBooster';
import OutreachKit from './pages/OutreachKit';
import Prospects from './pages/Prospects';
import Login from './pages/Login';

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
      <div className="flex min-h-screen items-center justify-center bg-[#132822] text-[#f4efe4]">
        <div className="text-center">
          <p className="font-display text-3xl">PulseLocal</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#d7e8c8]">Opening the desk</p>
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
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
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
