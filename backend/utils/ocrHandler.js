const Tesseract = require('tesseract.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Downloads an image from URL and saves it temporarily
 */
async function downloadImage(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const tempPath = path.join(__dirname, '..', 'temp', `receipt_${Date.now()}.jpg`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(tempPath));
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Extracts text from image using Tesseract.js OCR
 */
async function extractTextFromImage(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => console.log(m) // Optional: log progress
    });
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text found in image');
    }
    
    return text;
  } catch (error) {
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

/**
 * Parses receipt text to extract structured data
 */
function parseReceiptText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let amount = null;
  let currency = 'USD';
  let date = null;
  let description = '';
  let merchant = '';
  
  // Common currency symbols and codes
  const currencyPatterns = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    'USD': 'USD',
    'EUR': 'EUR',
    'GBP': 'GBP',
    'JPY': 'JPY',
    'INR': 'INR'
  };
  
  // Date patterns
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/i, // DD MMM YYYY
  ];
  
  // Amount patterns
  const amountPatterns = [
    /[\$€£¥₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/, // $1,234.56
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[\$€£¥₹]/, // 1,234.56$
    /Total[:\s]*[\$€£¥₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /Amount[:\s]*[\$€£¥₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /Subtotal[:\s]*[\$€£¥₹]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];
  
  // Extract amount
  for (const line of lines) {
    for (const pattern of amountPatterns) {
      const match = line.match(pattern);
      if (match) {
        const extractedAmount = parseFloat(match[1].replace(/,/g, ''));
        if (extractedAmount > 0 && (amount === null || extractedAmount > amount)) {
          amount = extractedAmount;
          
          // Extract currency from the same line
          for (const [symbol, code] of Object.entries(currencyPatterns)) {
            if (line.includes(symbol)) {
              currency = code;
              break;
            }
          }
        }
      }
    }
  }
  
  // Extract date
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        try {
          let dateStr;
          if (pattern.source.includes('Jan|Feb|Mar')) {
            // Handle month name format
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.findIndex(m => 
              m.toLowerCase() === match[2].toLowerCase()
            );
            dateStr = `${match[3]}-${String(monthIndex + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          } else {
            // Handle numeric formats
            const [, part1, part2, part3] = match;
            if (part1.length === 4) {
              // YYYY/MM/DD format
              dateStr = `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`;
            } else {
              // MM/DD/YYYY or DD/MM/YYYY - assume MM/DD/YYYY
              dateStr = `${part3}-${part1.padStart(2, '0')}-${part2.padStart(2, '0')}`;
            }
          }
          
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            date = dateStr;
            break;
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
  }
  
  // Extract merchant name (usually first few lines)
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (line.length > 3 && !line.match(/^\d+$/) && !line.match(/^\d+[\/\-]\d+/)) {
      merchant = line;
      break;
    }
  }
  
  // Extract description (look for item descriptions)
  const descriptionLines = [];
  for (const line of lines) {
    if (line.length > 5 && 
        !line.match(/^\d+[\/\-]\d+/) && // Not a date
        !line.match(/^[\$€£¥₹]?\s*\d+/) && // Not an amount
        !line.match(/^(Total|Subtotal|Tax|Amount|Date|Time)/i) && // Not a total line
        line !== merchant) {
      descriptionLines.push(line);
    }
  }
  
  description = descriptionLines.slice(0, 3).join(' | '); // Take first 3 description lines
  
  // If no date found, use current date
  if (!date) {
    const today = new Date();
    date = today.toISOString().split('T')[0];
  }
  
  return {
    amount: amount || 0,
    currency: currency,
    date: date,
    description: description || 'Receipt from ' + merchant,
    merchant: merchant || 'Unknown Merchant'
  };
}

/**
 * Main OCR parsing function using Tesseract.js
 */
exports.parse = async (imageUrl) => {
  let tempImagePath = null;
  
  try {
    // Validate image URL
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Valid image URL is required');
    }
    
    // Download image
    tempImagePath = await downloadImage(imageUrl);
    
    // Extract text using OCR
    const extractedText = await extractTextFromImage(tempImagePath);
    
    // Parse the extracted text
    const parsedData = parseReceiptText(extractedText);
    
    return parsedData;
    
  } catch (error) {
    console.error('OCR Error:', error.message);
    
    // Return fallback data if OCR fails
    return {
      amount: 0,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      description: 'OCR parsing failed - please enter manually',
      merchant: 'Unknown',
      error: error.message
    };
    
  } finally {
    // Clean up temporary file
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      try {
        fs.unlinkSync(tempImagePath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary file:', cleanupError.message);
      }
    }
  }
};

/**
 * Alternative OCR using Google Cloud Vision (if credentials are available)
 */
exports.parseWithGoogleVision = async (imageUrl) => {
  try {
    const vision = require('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-credentials.json',
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    const tempImagePath = await downloadImage(imageUrl);
    const [result] = await client.textDetection(tempImagePath);
    const detections = result.textAnnotations;
    
    if (detections.length === 0) {
      throw new Error('No text found in image');
    }
    
    const extractedText = detections[0].description;
    const parsedData = parseReceiptText(extractedText);
    
    // Clean up
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    
    return parsedData;
  } catch (error) {
    throw new Error(`Google Vision OCR failed: ${error.message}`);
  }
};
  