import { useQuery } from '@tanstack/react-query';
import { getStock } from '../api/stock';

export default function StockPage() {
  const { data: stock, isLoading } = useQuery({ queryKey: ['stock'], queryFn: getStock });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Control de Stock</h2>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Producto', 'SKU', 'Proveedor', 'Entradas', 'Salidas', 'Stock Disponible'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Cargando...</td></tr>}
            {stock?.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku_zorba || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{p.proveedor}</td>
                <td className="px-4 py-3 text-green-600 font-medium">{p.entradas_totales}</td>
                <td className="px-4 py-3 text-red-600 font-medium">{p.salidas_totales}</td>
                <td className="px-4 py-3">
                  <span className={`font-bold text-lg ${p.stock_disponible > 0 ? 'text-gray-900' : p.stock_disponible < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {p.stock_disponible}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && !stock?.length && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Sin movimientos de stock aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
