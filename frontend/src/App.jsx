import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import PendingPage from './pages/PendingPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseOrderDetailPage from './pages/PurchaseOrderDetailPage';
import SuppliersPage from './pages/SuppliersPage';
import ProductsPage from './pages/ProductsPage';
import StockPage from './pages/StockPage';

const PrivateRoute = ({ children }) => {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="pendientes" element={<PendingPage />} />
        <Route path="ordenes-compra" element={<PurchaseOrdersPage />} />
        <Route path="ordenes-compra/:id" element={<PurchaseOrderDetailPage />} />
        <Route path="proveedores" element={<SuppliersPage />} />
        <Route path="productos" element={<ProductsPage />} />
        <Route path="stock" element={<StockPage />} />
      </Route>
    </Routes>
  );
}
