const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { getApprovalStatus } = require('../controllers/approvalController');

router.get('/:expenseId', authenticate, getApprovalStatus);

module.exports = router;
