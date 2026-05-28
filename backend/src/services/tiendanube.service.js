const axios = require('axios');
const prisma = require('../config/prisma');

const tnClient = () => axios.create({
  baseURL: `${process.env.TIENDA_NUBE_API_URL}/${process.env.TIENDA_NUBE_STORE_ID}`,
  headers: {
    'Authentication': `bearer ${process.env.TIENDA_NUBE_ACCESS_TOKEN}`,
    'User-Agent': 'CasaZorba/1.0 (julietabrutus@gmail.com)',
    'Content-Type': 'application/json',
  },
});

// Trae pedidos de TN con paginación
const fetchOrders = async (params = {}) => {
  const client = tnClient();
  const defaultParams = {
    per_page: 50,
    page: 1,
    sort_by: 'created_at',
    sort_direction: 'desc',
    ...params,
  };

  const { data } = await client.get('/orders', { params: defaultParams });
  return data;
};

// Sincroniza pedidos de TN a la base de datos local
const syncOrders = async (filtros = {}) => {
  const stats = { nuevos: 0, actualizados: 0, errores: 0, total: 0 };
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const orders = await fetchOrders({ ...filtros, page });

    if (!orders || orders.length === 0) {
      hasMore = false;
      break;
    }

    for (const order of orders) {
      try {
        await upsertOrder(order);
        const existe = await prisma.orderTiendaNube.findUnique({
          where: { tienda_nube_order_id: String(order.id) },
        });
        existe ? stats.actualizados++ : stats.nuevos++;
        stats.total++;
      } catch (err) {
        console.error(`Error procesando pedido ${order.id}:`, err.message);
        stats.errores++;
      }
    }

    hasMore = orders.length === 50;
    page++;

    // Respetar rate limit TN: 40 req/min
    await new Promise(r => setTimeout(r, 1500));
  }

  return stats;
};

const upsertOrder = async (tnOrder) => {
  const orderData = {
    tienda_nube_order_id: String(tnOrder.id),
    numero_pedido: String(tnOrder.number),
    fecha_pedido: new Date(tnOrder.created_at),
    estado_pedido: tnOrder.status,
    estado_pago: tnOrder.payment_status,
    cliente_nombre: tnOrder.customer
      ? `${tnOrder.customer.name || ''} ${tnOrder.customer.last_name || ''}`.trim()
      : null,
    cliente_email: tnOrder.customer?.email || null,
    cliente_telefono: tnOrder.customer?.phone || null,
    total: parseFloat(tnOrder.total || 0),
    moneda: tnOrder.currency || 'ARS',
    notas: tnOrder.note || null,
    synced_at: new Date(),
  };

  const order = await prisma.orderTiendaNube.upsert({
    where: { tienda_nube_order_id: String(tnOrder.id) },
    create: orderData,
    update: { ...orderData },
  });

  // Sincronizar ítems
  if (tnOrder.products && tnOrder.products.length > 0) {
    for (const item of tnOrder.products) {
      // Buscar producto interno por ID de TN
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { tienda_nube_product_id: String(item.product_id) },
            { tienda_nube_variant_id: String(item.variant_id) },
          ],
        },
      });

      await prisma.orderItemTiendaNube.upsert({
        where: {
          id: `${order.id}-${item.id || item.product_id}`,
        },
        create: {
          id: `${order.id}-${item.id || item.product_id}`,
          tienda_nube_item_id: String(item.id || item.product_id),
          descripcion: item.name || 'Sin nombre',
          sku_tiendanube: item.sku || null,
          cantidad: parseInt(item.quantity || 1),
          precio_unitario: parseFloat(item.price || 0),
          orderId: order.id,
          productId: product?.id || null,
        },
        update: {
          descripcion: item.name || 'Sin nombre',
          sku_tiendanube: item.sku || null,
          cantidad: parseInt(item.quantity || 1),
          precio_unitario: parseFloat(item.price || 0),
          productId: product?.id || null,
        },
      });
    }
  }

  return order;
};

module.exports = { syncOrders, fetchOrders };
