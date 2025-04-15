const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.query.userId || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required. Please provide userId' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  authenticate
}; 