const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { isAuthenticated } = require('../middleware/authMiddleware');

router.get('/sign-up', authController.renderSignUp);
router.post('/sign-up', authController.register);

router.get('/sign-in', authController.renderSignIn);
router.post('/sign-in', authController.login);

router.get('/logout', authController.logout);

module.exports = router;