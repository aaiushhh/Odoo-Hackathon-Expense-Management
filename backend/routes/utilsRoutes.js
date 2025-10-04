const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { 
  parseReceipt, 
  parseReceiptFile, 
  convertCurrency, 
  listCountries,
  upload 
} = require('../controllers/utilsController');

// OCR endpoints
router.post('/ocr', authenticate, parseReceipt); // Parse from URL
router.post('/ocr/upload', authenticate, upload.single('receipt'), parseReceiptFile); // Parse from file upload

// Currency endpoints
router.get('/currency/convert', authenticate, convertCurrency);
router.get('/currency/countries', authenticate, listCountries);

module.exports = router;
