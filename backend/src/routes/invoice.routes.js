const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { list, getOne } = require('../controllers/invoice.controller');

router.use(authenticate);
router.get('/', list);
router.get('/:id', getOne);

module.exports = router;
