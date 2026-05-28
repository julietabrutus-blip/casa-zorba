import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier } from '../api/suppliers';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'new' | supplier_obj
  const [form, setForm] = useState({});

  const { data: suppliers, isLoading } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers });

  const saveMutation = useMutation({
    mutationFn: (data) => modal?.id ? updateSupplier(modal.id, data) : createSupplier(data),
    onSuccess: () => { toast.success('Proveedor guardado'); qc.invalidateQueries(['suppliers']); setModal(null); },
    onError: () => toast.error('Error al guardar'),
  });

  const openEdit = (s) => { setModal(s); setForm(s); };
  const openNew = () => { setModal('new'); setForm({}); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Proveedores</h2>
        <button onClick={openNew} className="btn-primary">+ Nuevo proveedor</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-gray-400">Cargando...</p>}
        {suppliers?.map(s => (
          <div key={s.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{s.nombre}</h3>
                {s.contacto_nombre && <p className="text-sm text-gray-500">{s.contacto_nombre}</p>}
              </div>
              <span className={`badge ${s.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {s.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              {s.telefono_whatsapp && <p>📱 {s.telefono_whatsapp}</p>}
              {s.email && <p>📧 {s.email}</p>}
              <p>📦 {s._count?.products || 0} productos · {s._count?.purchaseOrders || 0} OC</p>
            </div>
            <button onClick={() => openEdit(s)} className="btn-secondary mt-4 w-full text-sm">Editar</button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-lg">{modal === 'new' ? 'Nuevo Proveedor' : 'Editar Proveedor'}</h3>
            {[
              { key: 'nombre', label: 'Nombre *', required: true },
              { key: 'contacto_nombre', label: 'Contacto' },
              { key: 'telefono_whatsapp', label: 'WhatsApp (con código país, ej: 5491112345678)' },
              { key: 'email', label: 'Email' },
              { key: 'notas', label: 'Notas' },
            ].map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required={required}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zorba-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modo de envío preferido</label>
              <select value={form.modo_envio_preferido || 'whatsapp'} onChange={e => setForm(f => ({ ...f, modo_envio_preferido: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="manual">Manual</option>
              </select>
            </div>
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
