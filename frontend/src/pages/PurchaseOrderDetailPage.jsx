import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getPurchaseOrder, sendWhatsapp, sendEmail, updatePOStatus, cancelPO } from '../api/purchaseOrders';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showWA, setShowWA] = useState(false);
  const [waData, setWaData] = useState(null);

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => getPurchaseOrder(id),
  });

  const waMutation = useMutation({
    mutationFn: () => sendWhatsapp(id),
    onSuccess: (res) => { setWaData(res); setShowWA(true); qc.invalidateQueries(['purchase-order', id]); },
    onError: () => toast.error('Error al generar mensaje'),
  });

  const emailMutation = useMutation({
    mutationFn: () => sendEmail(id),
    onSuccess: () => { toast.success('Email enviado'); qc.invalidateQueries(['purchase-order', id]); },
    onError: (e) => toast.error(e?.error || 'Error al enviar email'),
  });

  const confirmMutation = useMutation({
    mutationFn: () => updatePOStatus(id, 'enviada'),
    onSuccess: () => { toast.success('OC marcada como enviada'); qc.invalidateQueries(['purchase-order', id]); setShowWA(false); },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPO(id),
    onSuccess: () => { toast.success('OC cancelada'); navigate('/ordenes-compra'); },
  });

  if (isLoading) return <div className="text-center py-20 text-gray-400">Cargando...</div>;
  if (!po) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{po.numero_oc}</h2>
          <p className="text-gray-500">Proveedor: <span className="font-medium text-gray-800">{po.supplier?.nombre}</span></p>
          <p className="text-gray-500">Fecha: {new Date(po.fecha).toLocaleDateString('es-AR')}</p>
          <span className="badge bg-blue-100 text-blue-800 mt-1">{po.estado}</span>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => waMutation.mutate()} disabled={waMutation.isPending} className="btn-primary">
            📱 WhatsApp
          </button>
          <button onClick={() => emailMutation.mutate()} disabled={emailMutation.isPending} className="btn-secondary">
            📧 Email
          </button>
          {po.estado !== 'cancelada' && (
            <button onClick={() => { if (confirm('¿Cancelar esta OC?')) cancelMutation.mutate(); }} className="btn-danger">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Modal WhatsApp */}
      {showWA && waData && (
        <div className="card border-2 border-green-300 bg-green-50">
          <h3 className="font-bold text-green-800 mb-3">📱 Mensaje para WhatsApp</h3>
          <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded-lg border border-green-200 mb-4 font-sans">
            {waData.mensaje}
          </pre>
          <div className="flex gap-3">
            <button
              onClick={() => { navigator.clipboard.writeText(waData.mensaje); toast.success('Copiado!'); }}
              className="btn-secondary"
            >
              📋 Copiar mensaje
            </button>
            <a href={waData.waUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Abrir WhatsApp →
            </a>
            <button onClick={() => confirmMutation.mutate()} className="btn-secondary">
              ✅ Ya lo envié
            </button>
          </div>
        </div>
      )}

      {/* Ítems */}
      <div className="card">
        <h3 className="font-semibold mb-4">Productos en esta OC</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Producto', 'Cód. Proveedor', 'Cantidad', 'Precio Est.'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {po.items?.map(item => (
              <tr key={item.id}>
                <td className="px-3 py-3 font-medium">{item.descripcion}</td>
                <td className="px-3 py-3 text-gray-500">{item.codigo_proveedor || '—'}</td>
                <td className="px-3 py-3 font-bold">{item.cantidad}</td>
                <td className="px-3 py-3 text-gray-600">
                  {item.precio_estimado ? `$${parseFloat(item.precio_estimado).toLocaleString('es-AR')}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {po.observaciones && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <strong>Observaciones:</strong> {po.observaciones}
          </div>
        )}
      </div>

      {/* Pedidos origen */}
      <div className="card">
        <h3 className="font-semibold mb-4">Pedidos de Tienda Nube origen</h3>
        <div className="space-y-2">
          {po.links?.map(link => (
            <div key={link.id} className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded">
              <span className="font-medium">#{link.tiendaNubeOrder?.numero_pedido}</span>
              <span className="text-gray-500">{link.tiendaNubeOrder?.cliente_nombre}</span>
              <span className="text-gray-400">{new Date(link.tiendaNubeOrder?.fecha_pedido).toLocaleDateString('es-AR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
