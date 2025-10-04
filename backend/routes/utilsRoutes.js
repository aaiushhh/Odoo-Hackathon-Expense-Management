const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { 
  parseReceipt, 
  parseReceiptFile, 
  convertCurrency, 
  listCountries,
  upload 
} = require('../controllers/utilsController');

// OCR endpoints
router.post('/ocr', auth, parseReceipt); // Parse from URL
router.post('/ocr/upload', auth, upload.single('receipt'), parseReceiptFile); // Parse from file upload

// Currency endpoints
router.get('/currency/convert', auth, convertCurrency);
router.get('/currency/countries', auth, listCountries);

module.exports = router;
