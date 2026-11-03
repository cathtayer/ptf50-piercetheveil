import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Clock, Scissors, Gem, Users, LogOut } from 'lucide-react';
import { signOut } from '../features/authentication/authService';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Appointments', path: '/admin/appointments', icon: CalendarDays },
    { name: 'Schedule', path: '/admin/schedule', icon: Clock },
    { name: 'Services', path: '/admin/services', icon: Scissors },
    { name: 'Jewelry Catalog', path: '/admin/jewelry', icon: Gem },
    { name: 'Customers', path: '/admin/customers', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-brand-black text-brand-cream font-sans overflow-hidden">
      {/* Dark Elegant Sidebar */}
      <aside className="w-64 bg-brand-dark border-r border-brand-blood/30 flex flex-col z-20">
        <div className="p-8 border-b border-brand-blood/30 text-center">
          <h1 className="text-3xl font-serif text-brand-cream tracking-wider">Pierce<br/><span className="italic text-brand-blood">the</span> Veil</h1>
          <p className="text-[10px] text-brand-muted mt-4 uppercase tracking-[0.3em]">Admin Portal</p>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 transition-all duration-300 ${
                  isActive
                    ? 'border-l-2 border-brand-blood text-brand-cream bg-brand-blood/5'
                    : 'border-l-2 border-transparent text-brand-muted hover:text-brand-cream hover:border-brand-muted/30'
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span className="font-light tracking-wide text-sm uppercase">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-brand-blood/30">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-4 px-4 py-2 w-full text-brand-muted hover:text-brand-cream transition-colors text-sm uppercase tracking-wide font-light"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-brand-black relative">
        <div className="p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
