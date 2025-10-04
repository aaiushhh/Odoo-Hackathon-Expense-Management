const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getApprovalStatus } = require('../controllers/approvalController');

router.get('/:expenseId', auth, getApprovalStatus);

module.exports = router;
