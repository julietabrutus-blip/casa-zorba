const prisma = require('../config/prisma');
const { syncOrders } = require('../services/tiendanube.service');

const sync = async (req, res) => {
  const stats = await syncOrders({ payment_status: 'paid' });
  res.json({ mensaje: 'Sincronización completada', ...stats });
};

const getOrders = async (req, res) => {
  const { estado_abastecimiento, estado_pago, desde, hasta, page = 1, limit = 20 } = req.query;

  const where = {};
  if (estado_abastecimiento) where.estado_abastecimiento = estado_abastecimiento;
  if (estado_pago) where.estado_pago = estado_pago;
  if (desde || hasta) {
    where.fecha_pedido = {};
    if (desde) where.fecha_pedido.gte = new Date(desde);
    if (hasta) where.fecha_pedido.lte = new Date(hasta);
  }

  const [orders, total] = await Promise.all([
    prisma.orderTiendaNube.findMany({
      where,
      include: {
        items: { include: { product: { include: { supplier: true } } } },
      },
      orderBy: { fecha_pedido: 'asc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.orderTiendaNube.count({ where }),
  ]);

  res.json({ data: orders, total, page: parseInt(page), limit: parseInt(limit) });
};

const updateFulfillment = async (req, res) => {
  const { id } = req.params;
  const { estado_abastecimiento } = req.body;

  const order = await prisma.orderTiendaNube.update({
    where: { id },
    data: { estado_abastecimiento },
  });
  res.json(order);
};

module.exports = { sync, getOrders, updateFulfillment };
