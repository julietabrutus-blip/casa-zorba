const prisma = require('../config/prisma');

const list = async (req, res) => {
  const invoices = await prisma.supplierInvoice.findMany({
    include: { supplier: { select: { nombre: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(invoices);
};

const getOne = async (req, res) => {
  const invoice = await prisma.supplierInvoice.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { supplier: true, items: true, matchResults: true, purchaseOrder: true },
  });
  res.json(invoice);
};

module.exports = { list, getOne };
