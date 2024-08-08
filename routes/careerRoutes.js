const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const upload = require('../middleware/upload');

router.post('/career-submit', upload.single('resume_file'), careerController.submitCareerForm); //working
router.get('/get-all-career', careerController.getAllCareer); //working

module.exports = router;
