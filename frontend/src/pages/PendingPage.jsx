import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingProducts } from '../api/products';
import { generatePurchaseOrders } from '../api/purchaseOrders';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function PendingPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState({});
  const { data: groups, isLoading } = useQuery({ queryKey: ['pending-products'], queryFn: getPendingProducts });

  const generateMutation = useMutation({
    mutationFn: () => generatePurchaseOrders({
      selectedItems: Object.entries(selected).map(([orderItemId, cantidad]) => ({ orderItemId, cantidad })),
    }),
    onSuccess: (res) => {
      toast.success(`${res.orders.length} OC generada(s) exitosamente`);
      qc.invalidateQueries();
      navigate('/ordenes-compra');
    },
    onError: () => toast.error('Error al generar órdenes'),
  });

  const toggleItem = (itemId, qty) => {
    setSelected(s => { const n = { ...s }; n[itemId] ? delete n[itemId] : (n[itemId] = qty); return n; });
  };

  const selectedCount = Object.keys(selected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Pendientes de Abastecimiento</h2>
          <p className="text-warm-500 text-sm mt-1">Productos de pedidos pagados sin OC asignada</p>
        </div>
        {selectedCount > 0 && (
          <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="btn-primary flex items-center gap-2">
            <span>📋</span>
            {generateMutation.isPending ? 'Generando...' : `Generar OC (${selectedCount} ítems)`}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card animate-pulse h-40 bg-warm-100" />)}
        </div>
      )}

      {groups?.map(group => (
        <div key={group.supplier.id} className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-zorba-100 rounded-xl flex items-center justify-center text-zorba-700 font-bold">
                {group.supplier.nombre[0]}
              </div>
              <div>
                <h3 className="font-bold text-warm-900">{group.supplier.nombre}</h3>
                <p className="text-xs text-warm-400">{group.items.length} producto(s) pendiente(s)</p>
              </div>
            </div>
            <button
              onClick={() => {
                const allSelected = group.items.every(i => selected[i.id]);
                setSelected(s => {
                  const n = { ...s };
                  allSelected ? group.items.forEach(i => delete n[i.id]) : group.items.forEach(i => n[i.id] = i.cantidad_pendiente);
                  return n;
                });
              }}
              className="btn-ghost text-sm"
            >
              {group.items.every(i => selected[i.id]) ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-warm-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-center">Pedido</th>
                  <th className="px-4 py-3 text-center">Asignado</th>
                  <th className="px-4 py-3 text-center font-bold">Pendiente</th>
                  <th className="px-4 py-3 text-left">Origen</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map(item => (
                  <tr key={item.id} className={`table-row ${selected[item.id] ? 'bg-zorba-50' : ''}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={!!selected[item.id]} onChange={() => toggleItem(item.id, item.cantidad_pendiente)}
                        className="rounded border-warm-300 text-zorba-600 focus:ring-zorba-400" />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-warm-900">{item.descripcion}</td>
                    <td className="px-4 py-3.5 text-warm-400 font-mono text-xs">{item.product?.codigo_proveedor || '—'}</td>
                    <td className="px-4 py-3.5 text-center text-warm-600">{item.cantidad}</td>
                    <td className="px-4 py-3.5 text-center text-blue-600">{item.cantidad_asignada_oc}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">{item.cantidad_pendiente}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-warm-400">#{item.order?.numero_pedido} — {item.order?.cliente_nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {!isLoading && !groups?.length && (
        <div className="card text-center py-20">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="font-semibold text-warm-800 text-lg">¡Todo abastecido!</h3>
          <p className="text-warm-400 mt-2">No hay productos pendientes de compra.</p>
        </div>
      )}
    </div>
  );
}
