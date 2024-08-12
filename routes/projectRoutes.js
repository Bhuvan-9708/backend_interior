const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const projectController = require('../controllers/projectController');

router.get('/get-all-projects', projectController.getAllProjects); //working
router.get('/get-project/:id', projectController.getProjectById); //working
router.post('/create-project', upload.single('project_image'), projectController.createProject);
router.put('/update-project/:id', upload.single('project_image'), projectController.updateProject);
router.delete('/delete-project/:id', projectController.deleteProject); //working

module.exports = router;
