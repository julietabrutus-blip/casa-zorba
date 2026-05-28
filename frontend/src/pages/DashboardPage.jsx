import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/dashboard';
import { syncOrders } from '../api/tiendanube';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const estadoBadge = {
  pendiente: 'bg-amber-100 text-amber-800',
  parcial: 'bg-blue-100 text-blue-800',
  completo: 'bg-emerald-100 text-emerald-800',
  borrador: 'bg-warm-100 text-warm-700',
  enviada: 'bg-blue-100 text-blue-800',
  confirmada: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-700',
};

const kpiConfig = [
  { key: 'pedidosPendientes', label: 'Pedidos pendientes', icon: '🛍️', color: 'amber', link: '/pedidos?estado_abastecimiento=pendiente' },
  { key: 'pedidosParciales', label: 'Pedidos parciales', icon: '⚡', color: 'blue', link: '/pedidos?estado_abastecimiento=parcial' },
  { key: 'ocBorradores', label: 'OC en borrador', icon: '📝', color: 'warm', link: '/ordenes-compra?estado=borrador' },
  { key: 'ocEnviadas', label: 'OC enviadas', icon: '✈️', color: 'indigo', link: '/ordenes-compra?estado=enviada' },
  { key: 'ocSinFactura', label: 'OC sin factura', icon: '🧾', color: 'red', link: '/ordenes-compra' },
  { key: 'itemsSinProducto', label: 'Ítems sin asignar', icon: '⚠️', color: 'orange', link: '/productos' },
];

const colorMap = {
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  warm: 'bg-warm-50 border-warm-200 text-warm-700',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
};

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardSummary });

  const syncMutation = useMutation({
    mutationFn: syncOrders,
    onSuccess: (res) => {
      toast.success(`Sync completado: ${res.nuevos} nuevos, ${res.actualizados} actualizados`);
      qc.invalidateQueries();
    },
    onError: () => toast.error('Error al sincronizar con Tienda Nube'),
  });

  const { kpis, ultimasOC, ultimosPedidos } = data || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Dashboard</h2>
          <p className="text-warm-500 text-sm mt-1">Resumen operativo de Casa Zorba</p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          <span>{syncMutation.isPending ? '⏳' : '🔄'}</span>
          {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Tienda Nube'}
        </button>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-warm-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiConfig.map(({ key, label, icon, color, link }) => (
            <Link key={key} to={link} className={`card-hover border ${colorMap[color]}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold">{kpis?.[key] ?? '—'}</p>
                  <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
                </div>
                <span className="text-2xl opacity-70">{icon}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Últimas actividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas OC */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-warm-800">Últimas Órdenes de Compra</h3>
            <Link to="/ordenes-compra" className="text-xs text-zorba-600 hover:underline font-medium">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {ultimasOC?.map(oc => (
              <Link key={oc.id} to={`/ordenes-compra/${oc.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-warm-50 transition-colors group">
                <div>
                  <p className="font-semibold text-sm text-warm-900 group-hover:text-zorba-700">{oc.numero_oc}</p>
                  <p className="text-xs text-warm-400 mt-0.5">{oc.supplier?.nombre}</p>
                </div>
                <span className={`badge ${estadoBadge[oc.estado] || 'bg-warm-100 text-warm-600'}`}>{oc.estado}</span>
              </Link>
            ))}
            {!ultimasOC?.length && (
              <div className="text-center py-8">
                <p className="text-warm-400 text-sm">Sin órdenes aún.</p>
                <Link to="/pendientes" className="text-zorba-600 text-sm hover:underline mt-1 inline-block">Generar primera OC →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Últimos pedidos */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-warm-800">Últimos Pedidos TN</h3>
            <Link to="/pedidos" className="text-xs text-zorba-600 hover:underline font-medium">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {ultimosPedidos?.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-warm-50 transition-colors">
                <div>
                  <p className="font-semibold text-sm text-warm-900">#{p.numero_pedido} <span className="font-normal text-warm-500">— {p.cliente_nombre}</span></p>
                  <p className="text-xs text-warm-400 mt-0.5">
                    {new Date(p.fecha_pedido).toLocaleDateString('es-AR')} · ${parseFloat(p.total).toLocaleString('es-AR')}
                  </p>
                </div>
                <span className={`badge ${estadoBadge[p.estado_abastecimiento] || 'bg-warm-100 text-warm-600'}`}>
                  {p.estado_abastecimiento}
                </span>
              </div>
            ))}
            {!ultimosPedidos?.length && (
              <div className="text-center py-8">
                <p className="text-warm-400 text-sm">Sin pedidos. Sincronizá Tienda Nube.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
