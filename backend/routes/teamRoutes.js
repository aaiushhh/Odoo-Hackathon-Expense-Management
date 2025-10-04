const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { createTeam, getTeamsByManager } = require('../controllers/teamController');

router.post('/', authenticate, createTeam); // Manager/Admin creates team
router.get('/my-teams', authenticate, getTeamsByManager); // Manager fetches teams

module.exports = router;
