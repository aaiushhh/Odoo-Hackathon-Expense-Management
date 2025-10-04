// routes/utilsRoutes.js
const express = require("express");
const router = express.Router();

// Middleware
const { authenticateToken } = require("../middlewares/authMiddleware");

// Controllers
const {
  parseReceipt,
  parseReceiptFile,
  convertCurrency,
  listCountries,
  upload,
} = require("../controllers/utilsController");

/**
 * -------------------------
 * OCR / Receipt Parsing
 * -------------------------
 */

// Parse receipt from URL or text
router.post("/ocr", authenticateToken, parseReceipt);

// Parse receipt from uploaded file
router.post(
  "/ocr/upload",
  authenticateToken,
  upload.single("receipt"),
  parseReceiptFile
);

/**
 * -------------------------
 * Currency Endpoints
 * -------------------------
 */

// Convert currency
router.get("/currency/convert", authenticateToken, convertCurrency);

// List supported countries/currencies
router.get("/currency/countries", authenticateToken, listCountries);

module.exports = router;
