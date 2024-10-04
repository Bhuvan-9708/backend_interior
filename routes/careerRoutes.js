const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const { upload } = require('../middleware/cloudinaryConfig.js');

router.post('/career-submit', upload.single('resume_file'), careerController.submitCareerForm); //working
router.get('/get-all-career', careerController.getAllCareer); //working
router.delete('/delete-application/:id', careerController.deleteApplicationsById);

module.exports = router;
