const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const todoRoutes = require('./routes/todoRoutes');
const { checkAuth } = require('./middleware/authMiddleware');

const app = express();
const profileRoutes = require('./routes/profileRoutes');

// And add this with your other app.use statements
app.use('/', profileRoutes);

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(checkAuth);
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to database
mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// Routes
app.use('/', authRoutes);
app.use('/', homeRoutes);
app.use('/', todoRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke! ' + err.message);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});