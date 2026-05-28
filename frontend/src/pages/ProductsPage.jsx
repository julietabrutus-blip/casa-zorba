import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct } from '../api/products';
import { getSuppliers } from '../api/suppliers';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');

  const { data: products, isLoading } = useQuery({ queryKey: ['products', search], queryFn: () => getProducts({ search }) });
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers });

  const saveMutation = useMutation({
    mutationFn: (data) => modal?.id ? updateProduct(modal.id, data) : createProduct(data),
    onSuccess: () => { toast.success('Producto guardado'); qc.invalidateQueries(['products']); setModal(null); },
    onError: () => toast.error('Error al guardar'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Productos & Equivalencias</h2>
        <button onClick={() => { setModal('new'); setForm({}); }} className="btn-primary">+ Nuevo producto</button>
      </div>

      <div className="card py-3">
        <input
          placeholder="Buscar por nombre, SKU o código..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zorba-500"
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Nombre', 'SKU Zorba', 'Cód. Proveedor', 'Proveedor', 'ID TN', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td></tr>}
            {products?.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.nombre_producto}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku_zorba || '—'}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.codigo_proveedor || '—'}</td>
                <td className="px-4 py-3">{p.supplier?.nombre}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.tienda_nube_product_id || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => { setModal(p); setForm(p); }} className="text-zorba-600 hover:underline text-sm">Editar</button>
                </td>
              </tr>
            ))}
            {!isLoading && !products?.length && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin productos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">{modal === 'new' ? 'Nuevo Producto' : 'Editar Producto'}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select value={form.supplierId || ''} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Seleccionar proveedor...</option>
                {suppliers?.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            {[
              { key: 'nombre_producto', label: 'Nombre del producto *' },
              { key: 'sku_zorba', label: 'SKU Casa Zorba' },
              { key: 'codigo_proveedor', label: 'Código del proveedor' },
              { key: 'tienda_nube_product_id', label: 'ID producto en Tienda Nube' },
              { key: 'tienda_nube_variant_id', label: 'ID variante en Tienda Nube' },
              { key: 'precio_compra_estimado', label: 'Precio de compra estimado ($)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="btn-primary flex-1">
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
