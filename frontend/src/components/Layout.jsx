import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const navItems = [
  { to: '/', label: '📊 Dashboard', exact: true },
  { to: '/pedidos', label: '🛍️ Pedidos TN' },
  { to: '/pendientes', label: '⏳ Pendientes' },
  { to: '/ordenes-compra', label: '📋 Órdenes de Compra' },
  { to: '/stock', label: '📦 Stock' },
  { to: '/proveedores', label: '🏭 Proveedores' },
  { to: '/productos', label: '🔧 Productos' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-zorba-700">🏠 Casa Zorba</h1>
          <p className="text-xs text-gray-500 mt-1">Operations Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zorba-50 text-zorba-700 border border-zorba-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">{user?.nombre || user?.email}</p>
          <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
