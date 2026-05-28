const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { getStock, getMovements } = require('../controllers/stock.controller');

router.use(authenticate);
router.get('/', getStock);
router.get('/movements', getMovements);

module.exports = router;
