const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const c = require('../controllers/purchaseOrder.controller');

router.use(authenticate);
router.get('/', c.list);
router.post('/generate', c.generate);
router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.patch('/:id/status', c.updateStatus);
router.post('/:id/send-whatsapp', c.sendWhatsapp);
router.post('/:id/send-email', c.sendEmail);
router.delete('/:id', c.cancel);

module.exports = router;
