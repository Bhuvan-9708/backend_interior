const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const upload = require('../middleware/upload');

router.post('/submit', upload.single('attachment'), contactController.submitContactForm); //working
router.get('/get-all-mail', contactController.getAllMail); //working

module.exports = router;
