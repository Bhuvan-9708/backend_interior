const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.post('/register', authController.register);  //working
router.post('/login', authController.login);  //working
router.post('/verify-opt', authController.verifyOtp);  //working
router.get('/get-all-admin', authController.getAllUser);  //working

module.exports = router;