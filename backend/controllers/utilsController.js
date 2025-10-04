const ocrHandler = require('../utils/ocrHandler');
const currencyConverter = require('../utils/currencyConverter');
const axios = require('axios');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'temp'));
  },
  filename: (req, file, cb) => {
    cb(null, `receipt_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// OCR receipt from URL
exports.parseReceipt = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Image URL is required' 
      });
    }
    
    const parsed = await ocrHandler.parse(imageUrl);
    
    res.json({ 
      success: true, 
      parsed 
    });
  } catch (err) {
    console.error('OCR Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// OCR receipt from uploaded file
exports.parseReceiptFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    const imagePath = req.file.path;
    const parsed = await ocrHandler.parse(imagePath);
    
    // Clean up uploaded file
    const fs = require('fs');
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    res.json({ 
      success: true, 
      parsed 
    });
  } catch (err) {
    console.error('OCR Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Currency conversion
exports.convertCurrency = async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    
    if (!from || !to || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'from, to, and amount parameters are required' 
      });
    }
    
    const convertedAmount = await currencyConverter.convert(from, to, parseFloat(amount));
    
    res.json({ 
      success: true, 
      from, 
      to, 
      amount: parseFloat(amount),
      convertedAmount 
    });
  } catch (err) {
    console.error('Currency Conversion Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// List countries & currencies
exports.listCountries = async (req, res) => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    const data = response.data.map(c => ({
      name: c.name.common,
      currencies: c.currencies
    }));
    
    res.json({ 
      success: true, 
      data 
    });
  } catch (err) {
    console.error('Countries API Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Export multer middleware for use in routes
exports.upload = upload;
