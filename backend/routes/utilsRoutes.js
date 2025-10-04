const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { parseReceipt, convertCurrency, listCountries } = require('../controllers/utilsController');

router.post('/ocr', authenticateToken, parseReceipt);
router.get('/currency/convert', authenticateToken, convertCurrency);
router.get('/countries', authenticateToken, listCountries);

module.exports = router;
