const express = require('express');
const authMiddleware = require('../middlewares/auth');
const authController = require('../controllers/authController');
const router = express.Router();


router.post('/login', authController.login);



module.exports = router;