const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { createTeam, getTeamsByManager } = require('../controllers/teamController');

router.post('/', auth, createTeam); // Manager/Admin creates team
router.get('/my-teams', auth, getTeamsByManager); // Manager fetches teams

module.exports = router;
