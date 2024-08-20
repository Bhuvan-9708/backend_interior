const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/register', authController.register);  //working
router.post('/login', authController.login);  //working
router.post('/verify-opt', authController.verifyOtp);  //working
router.get('/get-all-admin', authMiddleware, authController.getAllUser);  //working

module.exports = router;