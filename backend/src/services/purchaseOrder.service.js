const prisma = require('../config/prisma');

// Genera el próximo número de OC
const getNextOCNumber = async () => {
  const year = new Date().getFullYear();
  const last = await prisma.purchaseOrder.findFirst({
    where: { numero_oc: { startsWith: `OC-${year}-` } },
    orderBy: { numero_oc: 'desc' },
  });

  if (!last) return `OC-${year}-0001`;
  const lastNum = parseInt(last.numero_oc.split('-')[2]);
  return `OC-${year}-${String(lastNum + 1).padStart(4, '0')}`;
};

// Genera OC por proveedor a partir de ítems seleccionados
// selectedItems: [{ orderItemId, cantidad }]
const generatePurchaseOrders = async (selectedItems) => {
  // Cargar ítems con su info completa
  const items = await prisma.orderItemTiendaNube.findMany({
    where: { id: { in: selectedItems.map(i => i.orderItemId) } },
    include: { product: { include: { supplier: true } }, order: true },
  });

  // Agrupar por proveedor
  const bySupplier = {};
  for (const item of items) {
    const sid = item.product?.supplierId;
    if (!sid) continue;
    const requestedQty = selectedItems.find(s => s.orderItemId === item.id)?.cantidad || item.cantidad - item.cantidad_asignada_oc;

    if (!bySupplier[sid]) bySupplier[sid] = { supplier: item.product.supplier, items: [], orderIds: new Set() };
    bySupplier[sid].items.push({ item, cantidad: requestedQty });
    bySupplier[sid].orderIds.add(item.orderId);
  }

  const createdOrders = [];

  for (const [supplierId, group] of Object.entries(bySupplier)) {
    const numero_oc = await getNextOCNumber();

    const po = await prisma.purchaseOrder.create({
      data: {
        numero_oc,
        supplierId,
        estado: 'borrador',
        items: {
          create: group.items.map(({ item, cantidad }) => ({
            descripcion: item.descripcion,
            codigo_proveedor: item.product?.codigo_proveedor || null,
            cantidad,
            precio_estimado: item.product?.precio_compra_estimado || null,
            productId: item.product?.id || null,
            orderItemId: item.id,
          })),
        },
        links: {
          create: [...group.orderIds].map((orderId, idx) => ({
            tiendaNubeOrderId: orderId,
            prioridad: idx,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
        links: { include: { tiendaNubeOrder: true } },
      },
    });

    // Actualizar cantidad_asignada_oc en cada ítem
    for (const { item, cantidad } of group.items) {
      await prisma.orderItemTiendaNube.update({
        where: { id: item.id },
        data: { cantidad_asignada_oc: { increment: cantidad } },
      });
    }

    // Actualizar estado_abastecimiento de pedidos
    for (const orderId of group.orderIds) {
      await recalcOrderFulfillment(orderId);
    }

    createdOrders.push(po);
  }

  return createdOrders;
};

const recalcOrderFulfillment = async (orderId) => {
  const items = await prisma.orderItemTiendaNube.findMany({ where: { orderId } });
  const allCovered = items.every(i => i.cantidad_asignada_oc >= i.cantidad);
  const someCovered = items.some(i => i.cantidad_asignada_oc > 0);
  const estado = allCovered ? 'completo' : someCovered ? 'parcial' : 'pendiente';
  await prisma.orderTiendaNube.update({ where: { id: orderId }, data: { estado_abastecimiento: estado } });
};

// Genera mensaje de WhatsApp para una OC
const generateWhatsappMessage = (po) => {
  const lines = [
    `Hola ${po.supplier.nombre}! 👋`,
    `Les enviamos el siguiente pedido de *Casa Zorba*:`,
    `*OC: ${po.numero_oc}* — Fecha: ${new Date(po.fecha).toLocaleDateString('es-AR')}`,
    ``,
    `*Productos:*`,
    ...po.items.map(item =>
      `• ${item.descripcion}${item.codigo_proveedor ? ` (Cód: ${item.codigo_proveedor})` : ''} — *${item.cantidad} u.*`
    ),
    ``,
    po.observaciones ? `*Observaciones:* ${po.observaciones}` : null,
    ``,
    `Aguardamos confirmación. Muchas gracias!`,
    `_Casa Zorba_`,
  ].filter(l => l !== null);

  return lines.join('\n');
};

module.exports = { generatePurchaseOrders, generateWhatsappMessage };
