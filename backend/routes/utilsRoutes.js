const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { parseReceipt, convertCurrency, listCountries } = require('../controllers/utilsController');

router.post('/ocr', auth, parseReceipt);
router.get('/currency/convert', auth, convertCurrency);
router.get('/countries', auth, listCountries);

module.exports = router;
