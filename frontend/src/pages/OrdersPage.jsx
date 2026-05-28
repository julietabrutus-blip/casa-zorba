import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../api/tiendanube';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const estadoBadge = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  parcial: 'bg-blue-100 text-blue-800',
  completo: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const [filtros, setFiltros] = useState({ estado_abastecimiento: '', estado_pago: 'paid' });

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filtros],
    queryFn: () => getOrders(filtros),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pedidos Tienda Nube</h2>
        <Link to="/pendientes" className="btn-primary">⚡ Ver pendientes de abastecimiento</Link>
      </div>

      {/* Filtros */}
      <div className="card flex gap-4">
        <select
          value={filtros.estado_abastecimiento}
          onChange={e => setFiltros(f => ({ ...f, estado_abastecimiento: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
          <option value="completo">Completo</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['# Pedido', 'Fecha', 'Cliente', 'Total', 'Pago', 'Abastecimiento', 'Ítems'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            )}
            {data?.data?.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">#{order.numero_pedido}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(order.fecha_pedido).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3">{order.cliente_nombre || '—'}</td>
                <td className="px-4 py-3">${parseFloat(order.total).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-green-100 text-green-800">{order.estado_pago}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${estadoBadge[order.estado_abastecimiento] || 'bg-gray-100 text-gray-600'}`}>
                    {order.estado_abastecimiento}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{order.items?.length} ítem(s)</td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin pedidos. Sincronizá desde el Dashboard.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
