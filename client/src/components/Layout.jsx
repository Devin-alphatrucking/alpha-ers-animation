import { Outlet } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Toast } from './ui';

export default function Layout() {
  const { toast } = useDemo();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[1320px] px-6 py-7 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
