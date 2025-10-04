const Team = require('../models/Team');
const User = require('../models/User');

exports.createTeam = async (req, res) => {
  try {
    const { name, managerId, memberIds } = req.body;
    
    if (!name || !managerId) {
      return res.status(400).json({
        success: false,
        message: 'Team name and manager ID are required'
      });
    }

    const team = await Team.create({
      name,
      managerId,
      companyId: req.user.companyId,
      members: memberIds
    });

    // Update users to set teamId
    await User.updateMany({ _id: { $in: memberIds } }, { teamId: team._id });

    res.status(201).json({ 
      success: true,
      message: 'Team created successfully', 
      team 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.getTeamsByManager = async (req, res) => {
  try {
    const teams = await Team.find({ managerId: req.user._id }).populate('members', 'name email');
    res.json({ 
      success: true,
      teams 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
