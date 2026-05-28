const prisma = require('../config/prisma');
const { createError } = require('../middlewares/errorHandler');
const { generatePurchaseOrders, generateWhatsappMessage } = require('../services/purchaseOrder.service');
const nodemailer = require('nodemailer');

const list = async (req, res) => {
  const { estado, supplierId, desde, hasta, page = 1, limit = 20 } = req.query;
  const where = {};
  if (estado) where.estado = estado;
  if (supplierId) where.supplierId = supplierId;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta);
  }

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, nombre: true, telefono_whatsapp: true } },
        _count: { select: { items: true } },
      },
      orderBy: { fecha: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  res.json({ data: orders, total, page: parseInt(page), limit: parseInt(limit) });
};

const getOne = async (req, res) => {
  const po = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      supplier: true,
      items: { include: { product: true } },
      links: { include: { tiendaNubeOrder: { select: { id: true, numero_pedido: true, cliente_nombre: true, fecha_pedido: true } } } },
      whatsappLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      invoices: { select: { id: true, numero_factura: true, estado_procesamiento: true, fecha_factura: true } },
    },
  });
  res.json(po);
};

const generate = async (req, res) => {
  const { selectedItems } = req.body;
  if (!selectedItems || selectedItems.length === 0) throw createError(400, 'Debes seleccionar al menos un ítem.');
  const orders = await generatePurchaseOrders(selectedItems);
  res.status(201).json({ mensaje: `${orders.length} orden(es) de compra generadas.`, orders });
};

const update = async (req, res) => {
  const { observaciones, items, fecha_entrega_estimada } = req.body;
  const po = await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: { observaciones, fecha_entrega_estimada },
    include: { items: true, supplier: true },
  });
  res.json(po);
};

const updateStatus = async (req, res) => {
  const { estado } = req.body;
  const validStates = ['borrador', 'pendiente_envio', 'enviada', 'confirmada', 'cancelada', 'cerrada'];
  if (!validStates.includes(estado)) throw createError(400, `Estado inválido: ${estado}`);

  const po = await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: { estado },
  });
  res.json(po);
};

const sendWhatsapp = async (req, res) => {
  const po = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { supplier: true, items: { include: { product: true } } },
  });

  const mensaje = generateWhatsappMessage(po);
  const telefono = po.supplier.telefono_whatsapp?.replace(/\D/g, '') || '';
  const waUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  // Registrar log
  await prisma.whatsappLog.create({
    data: {
      supplierId: po.supplierId,
      purchaseOrderId: po.id,
      telefono_destino: telefono,
      mensaje,
      estado_envio: 'generado',
    },
  });

  // Actualizar estado OC
  await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: { estado: 'pendiente_envio', canal_envio: 'whatsapp' },
  });

  res.json({ mensaje, waUrl, telefono });
};

const sendEmail = async (req, res) => {
  const po = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { supplier: true, items: { include: { product: true } } },
  });

  if (!po.supplier.email) throw createError(400, 'El proveedor no tiene email configurado.');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const itemsHtml = po.items.map(i =>
    `<tr><td>${i.descripcion}</td><td>${i.codigo_proveedor || '-'}</td><td style="text-align:center">${i.cantidad}</td></tr>`
  ).join('');

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: po.supplier.email,
    subject: `Orden de Compra ${po.numero_oc} — Casa Zorba`,
    html: `
      <h2>Orden de Compra ${po.numero_oc}</h2>
      <p>Estimado/a ${po.supplier.nombre},</p>
      <p>Les enviamos la siguiente orden de compra:</p>
      <table border="1" cellpadding="8" style="border-collapse:collapse">
        <thead><tr><th>Producto</th><th>Código</th><th>Cantidad</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ${po.observaciones ? `<p><strong>Observaciones:</strong> ${po.observaciones}</p>` : ''}
      <p>Muchas gracias,<br/><strong>Casa Zorba</strong></p>
    `,
  });

  await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: { estado: 'enviada', canal_envio: 'email', fecha_envio: new Date() },
  });

  res.json({ mensaje: 'Email enviado correctamente.' });
};

const cancel = async (req, res) => {
  await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: { estado: 'cancelada' },
  });
  res.json({ mensaje: 'Orden cancelada.' });
};

module.exports = { list, getOne, generate, update, updateStatus, sendWhatsapp, sendEmail, cancel };
