import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingProducts } from '../api/products';
import { generatePurchaseOrders } from '../api/purchaseOrders';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function PendingPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState({}); // { orderItemId: cantidad }

  const { data: groups, isLoading } = useQuery({
    queryKey: ['pending-products'],
    queryFn: getPendingProducts,
  });

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
    setSelected(s => {
      const next = { ...s };
      if (next[itemId]) delete next[itemId];
      else next[itemId] = qty;
      return next;
    });
  };

  const selectedCount = Object.keys(selected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Productos Pendientes de Abastecimiento</h2>
        {selectedCount > 0 && (
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="btn-primary"
          >
            {generateMutation.isPending ? '⏳ Generando...' : `📋 Generar OC (${selectedCount} ítems seleccionados)`}
          </button>
        )}
      </div>

      {isLoading && <div className="text-center py-20 text-gray-400">Cargando...</div>}

      {groups?.map(group => (
        <div key={group.supplier.id} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">🏭 {group.supplier.nombre}</h3>
            <button
              onClick={() => {
                const allSelected = group.items.every(i => selected[i.id]);
                if (allSelected) {
                  setSelected(s => {
                    const next = { ...s };
                    group.items.forEach(i => delete next[i.id]);
                    return next;
                  });
                } else {
                  setSelected(s => {
                    const next = { ...s };
                    group.items.forEach(i => next[i.id] = i.cantidad_pendiente);
                    return next;
                  });
                }
              }}
              className="btn-secondary text-sm"
            >
              Seleccionar todo
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left w-8"></th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-center">Pedido</th>
                <th className="px-3 py-2 text-center">Asignado</th>
                <th className="px-3 py-2 text-center font-bold">Pendiente</th>
                <th className="px-3 py-2 text-left">Pedidos origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {group.items.map(item => (
                <tr key={item.id} className={selected[item.id] ? 'bg-zorba-50' : 'hover:bg-gray-50'}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!selected[item.id]}
                      onChange={() => toggleItem(item.id, item.cantidad_pendiente)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">{item.descripcion}</td>
                  <td className="px-3 py-2 text-gray-500">{item.product?.codigo_proveedor || '—'}</td>
                  <td className="px-3 py-2 text-center">{item.cantidad}</td>
                  <td className="px-3 py-2 text-center text-blue-600">{item.cantidad_asignada_oc}</td>
                  <td className="px-3 py-2 text-center font-bold text-orange-600">{item.cantidad_pendiente}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    #{item.order?.numero_pedido} — {item.order?.cliente_nombre}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {!isLoading && !groups?.length && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">✅</p>
          <p className="text-gray-500">No hay productos pendientes de abastecimiento.</p>
        </div>
      )}
    </div>
  );
}
