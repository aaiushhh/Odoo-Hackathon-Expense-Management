const ocrHandler = require('../utils/ocrHandler');
const currencyConverter = require('../utils/currencyConverter');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '..', 'temp');
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Preserve original extension
    const ext = path.extname(file.originalname);
    cb(null, `receipt_${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only image files with specific extensions
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Please upload JPG, PNG, GIF, BMP, TIFF, or WebP images.`), false);
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

// OCR receipt from uploaded file - NEW APPROACH: Host temporarily as URL
exports.parseReceiptFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    const imagePath = req.file.path;
    const fileName = path.basename(imagePath);
    
    console.log('Processing uploaded file:', imagePath);
    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: fileName
    });
    
    // Create a temporary URL for the uploaded image
    const tempImageUrl = `http://localhost:3000/api/utils/temp-image/${fileName}`;
    
    console.log('Temporary image URL:', tempImageUrl);
    
    // Use the existing URL-based OCR function
    const parsed = await ocrHandler.parse(tempImageUrl);
    
    // Clean up uploaded file after processing
    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
        console.log('Cleaned up uploaded file:', imagePath);
      } catch (cleanupError) {
        console.warn('Failed to clean up uploaded file:', cleanupError.message);
      }
    }
    
    res.json({ 
      success: true, 
      parsed 
    });
  } catch (err) {
    console.error('OCR Error:', err);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to clean up file on error:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Serve temporary images for OCR processing
exports.serveTempImage = (req, res) => {
  try {
    const fileName = req.params.filename;
    const imagePath = path.join(__dirname, '..', 'temp', fileName);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Image not found' 
      });
    }
    
    // Set appropriate headers
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.bmp':
        contentType = 'image/bmp';
        break;
      case '.tiff':
        contentType = 'image/tiff';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      default:
        contentType = 'image/jpeg';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(imagePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming image:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error serving image' 
      });
    });
    
  } catch (err) {
    console.error('Error serving temp image:', err);
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
    const rate = convertedAmount / parseFloat(amount);
    
    res.json({ 
      success: true, 
      from, 
      to, 
      rate: rate.toFixed(4),
      convertedAmount: convertedAmount.toFixed(2)
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

// Test OCR functionality
exports.testOCR = async (req, res) => {
  try {
    const result = await ocrHandler.testOCR();
    res.json(result);
  } catch (err) {
    console.error('OCR Test Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// Export multer middleware for use in routes
exports.upload = upload;
