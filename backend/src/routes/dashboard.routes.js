const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { getSummary } = require('../controllers/dashboard.controller');

router.use(authenticate);
router.get('/summary', getSummary);

module.exports = router;
