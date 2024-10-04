const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/register-user', authController.registerUser); 
router.post('/login-user', authController.authUser); 
router.post('/verify-opt', authController.verifyOtp);  
router.post('/logout-user', authController.logoutUser);  

router.post('/verify-otp', authController.verifyAdminOtp);  
router.post('/register-admin', authController.registerAdmin); 
router.post('/login-admin', authController.authAdmin); 
router.get('/get-all-admin', authController.getAllAdmin); 

module.exports = router;