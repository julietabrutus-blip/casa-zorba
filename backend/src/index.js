require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');

const { errorHandler } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const supplierRoutes = require('./routes/supplier.routes');
const productRoutes = require('./routes/product.routes');
const tiendaNubeRoutes = require('./routes/tiendanube.routes');
const purchaseOrderRoutes = require('./routes/purchaseOrder.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const stockRoutes = require('./routes/stock.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tiendanube', tiendaNubeRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handler global
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Zorba Backend corriendo en http://localhost:${PORT}`);
});

module.exports = app;
