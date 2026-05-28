import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', exact: true },
  { to: '/pedidos', label: 'Pedidos TN', icon: '🛍️' },
  { to: '/pendientes', label: 'Pendientes', icon: '⏳' },
  { to: '/ordenes-compra', label: 'Órdenes de Compra', icon: '📋' },
  { to: '/stock', label: 'Stock', icon: '📦' },
  { to: '/proveedores', label: 'Proveedores', icon: '🏭' },
  { to: '/productos', label: 'Productos', icon: '🔧' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-warm-50">
      <aside className="w-64 bg-white border-r border-warm-100 flex flex-col">
        <div className="p-5 border-b border-warm-100">
          <div className="flex flex-col items-center">
            <img src="/logo-casazorba.png" alt="Casa Zorba" className="h-12 w-auto object-contain" />
            <p className="text-xs text-warm-400 font-medium mt-2">Operations Platform</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-warm-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-warm-50">
            <div className="w-8 h-8 rounded-full bg-zorba-100 flex items-center justify-center text-zorba-700 font-bold text-sm">
              {(user?.nombre || 'A')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-warm-800 truncate">{user?.nombre || 'Admin'}</p>
              <p className="text-xs text-warm-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="mt-2 w-full text-left px-3 py-1.5 text-xs text-warm-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
          >
            Cerrar sesión →
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
