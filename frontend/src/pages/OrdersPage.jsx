import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../api/tiendanube';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const estadoBadge = {
  pendiente: 'bg-amber-100 text-amber-800',
  parcial: 'bg-blue-100 text-blue-800',
  completo: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [filtros, setFiltros] = useState({ estado_abastecimiento: '', estado_pago: 'paid' });
  const { data, isLoading } = useQuery({ queryKey: ['orders', filtros], queryFn: () => getOrders(filtros) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Pedidos Tienda Nube</h2>
          <p className="text-warm-500 text-sm mt-1">{data?.total || 0} pedidos encontrados</p>
        </div>
        <Link to="/pendientes" className="btn-primary flex items-center gap-2">
          <span>⚡</span> Pendientes de abastecimiento
        </Link>
      </div>

      <div className="card py-4">
        <select
          value={filtros.estado_abastecimiento}
          onChange={e => setFiltros(f => ({ ...f, estado_abastecimiento: e.target.value }))}
          className="select max-w-xs"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
          <option value="completo">Completo</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              {['# Pedido', 'Fecha', 'Cliente', 'Total', 'Pago', 'Abastecimiento', 'Ítems'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-16 text-warm-400">Cargando...</td></tr>}
            {data?.data?.map(order => (
              <tr key={order.id} className="table-row">
                <td className="px-5 py-4 font-semibold text-warm-900">#{order.numero_pedido}</td>
                <td className="px-5 py-4 text-warm-500">{new Date(order.fecha_pedido).toLocaleDateString('es-AR')}</td>
                <td className="px-5 py-4 text-warm-700">{order.cliente_nombre || '—'}</td>
                <td className="px-5 py-4 font-medium">${parseFloat(order.total).toLocaleString('es-AR')}</td>
                <td className="px-5 py-4"><span className="badge bg-emerald-100 text-emerald-700">{order.estado_pago}</span></td>
                <td className="px-5 py-4">
                  <span className={`badge ${estadoBadge[order.estado_abastecimiento] || 'bg-warm-100 text-warm-600'}`}>
                    {order.estado_abastecimiento}
                  </span>
                </td>
                <td className="px-5 py-4 text-warm-500">{order.items?.length}</td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={7} className="text-center py-16 text-warm-400">Sin pedidos. Sincronizá desde el Dashboard.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
