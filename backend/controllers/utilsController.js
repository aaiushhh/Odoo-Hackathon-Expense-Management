const ocrHandler = require('../utils/ocrHandler');
const currencyConverter = require('../utils/currencyConverter');
const axios = require('axios');

// OCR receipt
exports.parseReceipt = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const parsed = await ocrHandler.parse(imageUrl);
    res.json({ parsed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Currency conversion
exports.convertCurrency = async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    const convertedAmount = await currencyConverter.convert(from, to, parseFloat(amount));
    res.json({ from, to, convertedAmount });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
