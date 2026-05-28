import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/dashboard';
import { syncOrders } from '../api/tiendanube';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const estadoBadge = {
  pendiente: 'badge bg-yellow-100 text-yellow-800',
  parcial: 'badge bg-blue-100 text-blue-800',
  completo: 'badge bg-green-100 text-green-800',
  borrador: 'badge bg-gray-100 text-gray-700',
  enviada: 'badge bg-blue-100 text-blue-800',
  confirmada: 'badge bg-green-100 text-green-800',
};

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSummary,
  });

  const syncMutation = useMutation({
    mutationFn: syncOrders,
    onSuccess: (res) => {
      toast.success(`Sync completado: ${res.nuevos} nuevos, ${res.actualizados} actualizados`);
      qc.invalidateQueries();
    },
    onError: () => toast.error('Error al sincronizar'),
  });

  if (isLoading) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  const { kpis, ultimasOC, ultimosPedidos } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="btn-primary"
        >
          {syncMutation.isPending ? '⏳ Sincronizando...' : '🔄 Sincronizar Tienda Nube'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Pedidos pendientes" value={kpis?.pedidosPendientes} color="yellow" link="/pedidos?estado_abastecimiento=pendiente" />
        <KPICard label="Pedidos parciales" value={kpis?.pedidosParciales} color="blue" link="/pedidos?estado_abastecimiento=parcial" />
        <KPICard label="OC borradores" value={kpis?.ocBorradores} color="gray" link="/ordenes-compra?estado=borrador" />
        <KPICard label="OC enviadas" value={kpis?.ocEnviadas} color="green" link="/ordenes-compra?estado=enviada" />
        <KPICard label="OC sin factura" value={kpis?.ocSinFactura} color="red" link="/ordenes-compra" />
        <KPICard label="Ítems sin proveedor" value={kpis?.itemsSinProducto} color="orange" link="/productos" />
        <KPICard label="Proveedores activos" value={kpis?.proveedoresActivos} color="purple" link="/proveedores" />
      </div>

      {/* Últimas OC y Pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Últimas Órdenes de Compra</h3>
          <div className="space-y-2">
            {ultimasOC?.map(oc => (
              <Link key={oc.id} to={`/ordenes-compra/${oc.id}`} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{oc.numero_oc}</p>
                  <p className="text-xs text-gray-500">{oc.supplier?.nombre}</p>
                </div>
                <span className={estadoBadge[oc.estado] || 'badge bg-gray-100 text-gray-600'}>{oc.estado}</span>
              </Link>
            ))}
            {!ultimasOC?.length && <p className="text-sm text-gray-400 text-center py-4">Sin órdenes aún</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Últimos Pedidos TN</h3>
          <div className="space-y-2">
            {ultimosPedidos?.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">#{p.numero_pedido} — {p.cliente_nombre}</p>
                  <p className="text-xs text-gray-500">{new Date(p.fecha_pedido).toLocaleDateString('es-AR')} · ${parseFloat(p.total).toLocaleString('es-AR')}</p>
                </div>
                <span className={estadoBadge[p.estado_abastecimiento] || 'badge bg-gray-100 text-gray-600'}>{p.estado_abastecimiento}</span>
              </div>
            ))}
            {!ultimosPedidos?.length && <p className="text-sm text-gray-400 text-center py-4">Sin pedidos aún</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, color, link }) {
  const colors = {
    yellow: 'border-yellow-300 bg-yellow-50',
    blue: 'border-blue-300 bg-blue-50',
    gray: 'border-gray-300 bg-gray-50',
    green: 'border-green-300 bg-green-50',
    red: 'border-red-300 bg-red-50',
    orange: 'border-orange-300 bg-orange-50',
    purple: 'border-purple-300 bg-purple-50',
  };
  return (
    <Link to={link || '#'} className={`card border-l-4 ${colors[color]} hover:shadow-md transition-shadow`}>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </Link>
  );
}
