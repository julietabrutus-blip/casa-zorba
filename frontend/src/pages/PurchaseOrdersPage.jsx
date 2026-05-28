import { useQuery } from '@tanstack/react-query';
import { getPurchaseOrders } from '../api/purchaseOrders';
import { Link } from 'react-router-dom';

const estadoConfig = {
  borrador: { label: 'Borrador', cls: 'bg-gray-100 text-gray-700' },
  pendiente_envio: { label: 'Pendiente envío', cls: 'bg-yellow-100 text-yellow-800' },
  enviada: { label: 'Enviada', cls: 'bg-blue-100 text-blue-800' },
  confirmada: { label: 'Confirmada', cls: 'bg-green-100 text-green-800' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-100 text-red-800' },
};

export default function PurchaseOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => getPurchaseOrders({}),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Órdenes de Compra</h2>
        <Link to="/pendientes" className="btn-primary">+ Nueva OC</Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['N° OC', 'Proveedor', 'Fecha', 'Estado', 'Canal', 'Ítems', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td></tr>}
            {data?.data?.map(oc => {
              const cfg = estadoConfig[oc.estado] || { label: oc.estado, cls: 'bg-gray-100 text-gray-600' };
              return (
                <tr key={oc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{oc.numero_oc}</td>
                  <td className="px-4 py-3">{oc.supplier?.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(oc.fecha).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3"><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                  <td className="px-4 py-3 text-gray-500">{oc.canal_envio || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{oc._count?.items}</td>
                  <td className="px-4 py-3">
                    <Link to={`/ordenes-compra/${oc.id}`} className="text-zorba-600 hover:underline text-sm">Ver →</Link>
                  </td>
                </tr>
              );
            })}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin órdenes. Generá una desde Pendientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
