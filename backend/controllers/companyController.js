const Company = require('../models/Company');
const User = require('../models/User');

// Get company details
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      company
    });
  } catch (err) {
    console.error('Get Company Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update company details (Admin only)
exports.updateCompany = async (req, res) => {
  try {
    const { name, currency, address } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (currency) updates.currency = currency.toUpperCase();
    if (address !== undefined) updates.address = address;

    const company = await Company.findByIdAndUpdate(
      req.user.companyId,
      updates,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company updated successfully',
      company
    });
  } catch (err) {
    console.error('Update Company Error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

