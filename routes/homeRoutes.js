const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const homeController = require('../controller/homeController');

router.get('/', homeController.getHomePage);

module.exports = router;