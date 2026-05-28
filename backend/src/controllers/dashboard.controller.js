const prisma = require('../config/prisma');

const getSummary = async (req, res) => {
  const [
    pedidosPendientes,
    pedidosParciales,
    ocBorradores,
    ocEnviadas,
    ocSinFactura,
    itemsSinProducto,
    proveedoresActivos,
    ultimasOC,
    ultimosPedidos,
  ] = await Promise.all([
    prisma.orderTiendaNube.count({ where: { estado_abastecimiento: 'pendiente', estado_pago: 'paid' } }),
    prisma.orderTiendaNube.count({ where: { estado_abastecimiento: 'parcial', estado_pago: 'paid' } }),
    prisma.purchaseOrder.count({ where: { estado: 'borrador' } }),
    prisma.purchaseOrder.count({ where: { estado: 'enviada' } }),
    prisma.purchaseOrder.count({ where: { estado: 'enviada', invoices: { none: {} } } }),
    prisma.orderItemTiendaNube.count({ where: { productId: null } }),
    prisma.supplier.count({ where: { activo: true } }),
    prisma.purchaseOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { supplier: { select: { nombre: true } } },
      select: { id: true, numero_oc: true, estado: true, fecha: true, supplier: true },
    }),
    prisma.orderTiendaNube.findMany({
      take: 5,
      where: { estado_pago: 'paid' },
      orderBy: { fecha_pedido: 'desc' },
      select: { id: true, numero_pedido: true, cliente_nombre: true, total: true, fecha_pedido: true, estado_abastecimiento: true },
    }),
  ]);

  res.json({
    kpis: {
      pedidosPendientes,
      pedidosParciales,
      ocBorradores,
      ocEnviadas,
      ocSinFactura,
      itemsSinProducto,
      proveedoresActivos,
    },
    ultimasOC,
    ultimosPedidos,
  });
};

module.exports = { getSummary };
