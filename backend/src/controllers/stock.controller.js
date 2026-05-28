const prisma = require('../config/prisma');

const getStock = async (req, res) => {
  const products = await prisma.product.findMany({
    where: { activo: true },
    include: {
      supplier: { select: { nombre: true } },
      stockMovements: true,
    },
  });

  const stock = products.map(p => {
    const entradas = p.stockMovements.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.cantidad, 0);
    const salidas = p.stockMovements.filter(m => m.tipo === 'salida').reduce((s, m) => s + m.cantidad, 0);
    return {
      id: p.id,
      nombre: p.nombre_producto,
      sku_zorba: p.sku_zorba,
      proveedor: p.supplier?.nombre,
      stock_disponible: entradas - salidas,
      entradas_totales: entradas,
      salidas_totales: salidas,
    };
  });

  res.json(stock);
};

const getMovements = async (req, res) => {
  const { productId, tipo, desde, hasta } = req.query;
  const where = {};
  if (productId) where.productId = productId;
  if (tipo) where.tipo = tipo;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta);
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: { product: { select: { nombre_producto: true, sku_zorba: true } } },
    orderBy: { fecha: 'desc' },
    take: 100,
  });
  res.json(movements);
};

module.exports = { getStock, getMovements };
