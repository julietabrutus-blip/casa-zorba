const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { sync, getOrders, updateFulfillment } = require('../controllers/tiendanube.controller');

router.use(authenticate);
router.get('/sync', sync);
router.get('/orders', getOrders);
router.patch('/orders/:id/fulfillment', updateFulfillment);

module.exports = router;
