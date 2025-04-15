const mongoose = require('mongoose');
<<<<<<< HEAD
=======

>>>>>>> d2450b9d33be24b54baaab51cf309e35f72008f0
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  preferences: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 3;
      },
<<<<<<< HEAD
      message: 'You can select maximum 3 company preferences'
=======
      message: 'You can select maximum 3 preferences'
>>>>>>> d2450b9d33be24b54baaab51cf309e35f72008f0
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema); 