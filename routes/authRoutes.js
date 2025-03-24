const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const authController = require('../controller/authController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Authentication routes
router.get('/sign-up', authController.renderSignUp);
router.post('/sign-up', authController.register);

router.get('/sign-in', authController.renderSignIn);
router.post('/sign-in', authController.login);

router.get('/logout', authController.logout);
router.get('/confirm-logout', isAuthenticated, authController.renderLogoutConfirmation);

// Profile routes (moved from profileRoutes.js)
router.get('/Profile', isAuthenticated, authController.getProfile);
router.get('/change-password', isAuthenticated, authController.renderChangePassword);
router.post('/change-password', isAuthenticated, authController.changePassword);

// Admin route for all todos
router.get('/all-todos', isAuthenticated, authController.getAllTodos);

module.exports = router;