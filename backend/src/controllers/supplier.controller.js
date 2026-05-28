const prisma = require('../config/prisma');
const { createError } = require('../middlewares/errorHandler');

const list = async (req, res) => {
  const { activo } = req.query;
  const where = activo !== undefined ? { activo: activo === 'true' } : {};
  const suppliers = await prisma.supplier.findMany({
    where,
    include: { _count: { select: { products: true, purchaseOrders: true } } },
    orderBy: { nombre: 'asc' },
  });
  res.json(suppliers);
};

const getOne = async (req, res) => {
  const supplier = await prisma.supplier.findUniqueOrThrow({ where: { id: req.params.id } });
  res.json(supplier);
};

const create = async (req, res) => {
  const { nombre, telefono_whatsapp, email, contacto_nombre, modo_envio_preferido, notas } = req.body;
  if (!nombre) throw createError(400, 'El nombre del proveedor es requerido.');

  const supplier = await prisma.supplier.create({
    data: { nombre, telefono_whatsapp, email, contacto_nombre, modo_envio_preferido, notas },
  });
  res.status(201).json(supplier);
};

const update = async (req, res) => {
  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(supplier);
};

const remove = async (req, res) => {
  await prisma.supplier.update({
    where: { id: req.params.id },
    data: { activo: false },
  });
  res.json({ mensaje: 'Proveedor desactivado.' });
};

module.exports = { list, getOne, create, update, remove };
