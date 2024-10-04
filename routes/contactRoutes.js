const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { upload } = require('../middleware/cloudinaryConfig.js');

router.post('/submit', upload.single('attachment'), contactController.submitContactForm); //working
router.get('/get-all-mail', contactController.getAllMail); //working
router.delete('/delete-mail/:id', contactController.deleteContactForm);

module.exports = router;
