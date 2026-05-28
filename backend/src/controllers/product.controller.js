const prisma = require('../config/prisma');
const { createError } = require('../middlewares/errorHandler');

const list = async (req, res) => {
  const { supplierId, activo, search } = req.query;
  const where = {};
  if (supplierId) where.supplierId = supplierId;
  if (activo !== undefined) where.activo = activo === 'true';
  if (search) where.OR = [
    { nombre_producto: { contains: search, mode: 'insensitive' } },
    { sku_zorba: { contains: search, mode: 'insensitive' } },
    { codigo_proveedor: { contains: search, mode: 'insensitive' } },
  ];

  const products = await prisma.product.findMany({
    where,
    include: { supplier: { select: { id: true, nombre: true } } },
    orderBy: { nombre_producto: 'asc' },
  });
  res.json(products);
};

// Productos con cantidad pendiente de compra > 0 (agrupados por proveedor)
const getPending = async (req, res) => {
  const items = await prisma.orderItemTiendaNube.findMany({
    where: {
      product: { isNot: null },
      order: { estado_abastecimiento: { in: ['pendiente', 'parcial'] }, estado_pago: 'paid' },
    },
    include: {
      product: { include: { supplier: true } },
      order: { select: { id: true, numero_pedido: true, fecha_pedido: true, cliente_nombre: true } },
    },
    orderBy: { order: { fecha_pedido: 'asc' } },
  });

  // Filtrar ítems con pendiente real
  const pending = items.filter(item => item.cantidad - item.cantidad_asignada_oc > 0);

  // Agrupar por proveedor
  const bySupplier = {};
  for (const item of pending) {
    const sid = item.product?.supplierId;
    if (!sid) continue;
    if (!bySupplier[sid]) {
      bySupplier[sid] = {
        supplier: item.product.supplier,
        items: [],
      };
    }
    bySupplier[sid].items.push({
      ...item,
      cantidad_pendiente: item.cantidad - item.cantidad_asignada_oc,
    });
  }

  res.json(Object.values(bySupplier));
};

const getOne = async (req, res) => {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { supplier: true },
  });
  res.json(product);
};

const create = async (req, res) => {
  const { nombre_producto, supplierId, sku_zorba, codigo_proveedor, tienda_nube_product_id,
    tienda_nube_variant_id, descripcion, precio_compra_estimado } = req.body;
  if (!nombre_producto || !supplierId) throw createError(400, 'nombre_producto y supplierId son requeridos.');

  const product = await prisma.product.create({
    data: { nombre_producto, supplierId, sku_zorba, codigo_proveedor, tienda_nube_product_id,
      tienda_nube_variant_id, descripcion, precio_compra_estimado },
    include: { supplier: true },
  });
  res.status(201).json(product);
};

const update = async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
    include: { supplier: true },
  });
  res.json(product);
};

const remove = async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { activo: false } });
  res.json({ mensaje: 'Producto desactivado.' });
};

module.exports = { list, getPending, getOne, create, update, remove };
