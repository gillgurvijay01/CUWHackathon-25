const validateUserRegistration = (req, res, next) => {
  const { username, email, password, preferences } = req.body;
  const errors = {};
  if (!username || username.trim() === '') {
    errors.username = 'Username is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters long';
  }
  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Please provide a valid email address';
    }
  }
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  if (preferences && preferences.length > 3) {
    errors.preferences = 'Maximum 3 preferences allowed';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = {
  validateUserRegistration
}; 