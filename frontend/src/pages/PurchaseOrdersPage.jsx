import { useQuery } from '@tanstack/react-query';
import { getPurchaseOrders } from '../api/purchaseOrders';
import { Link } from 'react-router-dom';

const estadoConfig = {
  borrador: { label: 'Borrador', cls: 'bg-warm-100 text-warm-700' },
  pendiente_envio: { label: 'Pend. envío', cls: 'bg-amber-100 text-amber-800' },
  enviada: { label: 'Enviada', cls: 'bg-blue-100 text-blue-800' },
  confirmada: { label: 'Confirmada', cls: 'bg-emerald-100 text-emerald-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
};

export default function PurchaseOrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['purchase-orders'], queryFn: () => getPurchaseOrders({}) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Órdenes de Compra</h2>
          <p className="text-warm-500 text-sm mt-1">{data?.total || 0} órdenes</p>
        </div>
        <Link to="/pendientes" className="btn-primary flex items-center gap-2">
          <span>+</span> Nueva OC
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              {['N° OC', 'Proveedor', 'Fecha', 'Estado', 'Canal', 'Ítems', ''].map(h => (
                <th key={h} className="px-5 py-3.5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="text-center py-16 text-warm-400">Cargando...</td></tr>}
            {data?.data?.map(oc => {
              const cfg = estadoConfig[oc.estado] || { label: oc.estado, cls: 'bg-warm-100 text-warm-600' };
              return (
                <tr key={oc.id} className="table-row">
                  <td className="px-5 py-4 font-semibold text-warm-900">{oc.numero_oc}</td>
                  <td className="px-5 py-4 text-warm-700">{oc.supplier?.nombre}</td>
                  <td className="px-5 py-4 text-warm-500">{new Date(oc.fecha).toLocaleDateString('es-AR')}</td>
                  <td className="px-5 py-4"><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                  <td className="px-5 py-4 text-warm-500 capitalize">{oc.canal_envio || '—'}</td>
                  <td className="px-5 py-4 text-warm-500">{oc._count?.items}</td>
                  <td className="px-5 py-4">
                    <Link to={`/ordenes-compra/${oc.id}`} className="text-zorba-600 hover:text-zorba-800 font-medium text-sm">Ver →</Link>
                  </td>
                </tr>
              );
            })}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={7} className="text-center py-16 text-warm-400">Sin órdenes. Generá una desde Pendientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
