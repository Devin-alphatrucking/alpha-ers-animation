import { NavLink, Outlet } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import Sidebar, { groups } from './Sidebar';
import TopBar from './TopBar';
import { Toast } from './ui';

function MobileNav() {
  const { owner, state } = useDemo();
  const unread = state.leads.filter((l) => l.unread).length;
  const links = groups.filter((g) => owner || !g.ownerOnly).flatMap((g) => g.links);

  return (
    <nav className="flex shrink-0 overflow-x-auto border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          className={({ isActive }) =>
            `relative flex min-w-[64px] flex-1 flex-col items-center gap-1 px-2 py-2 text-[10px] font-medium transition ${
              isActive ? 'text-pine' : 'text-mute'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? <span className="absolute top-0 h-[2px] w-8 rounded-b bg-ember" /> : null}
              <l.icon size={18} strokeWidth={1.75} />
              <span className="whitespace-nowrap">{l.label}</span>
              {l.badge === 'unread' && unread > 0 ? (
                <span className="absolute right-[calc(50%-18px)] top-1.5 h-2 w-2 rounded-full bg-ember" />
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { toast } = useDemo();

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
      <Toast toast={toast} />
    </div>
  );
}
