const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');


dotenv.config();
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
//   next();
// });


app.get('/', (req, res) => {
  res.json({ message: 'RSS Feed API is running!' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'API is running!' });
}
);

app.use('/api/users', userRoutes);
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/NewsFeed')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
module.exports = app;
