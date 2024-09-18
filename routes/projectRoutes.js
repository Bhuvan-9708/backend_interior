const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ProjectController = require("../controllers/projectController");

router.get('/get-all-projects', ProjectController.getAllProjects);
router.get('/get-project/:id', ProjectController.getProjectById); 
router.post('/create-project', upload.any(), ProjectController.createProject);
router.put('/update-project/:id', upload.any(), ProjectController.updateProject);
router.delete('/delete-project/:id', ProjectController.deleteProject); 

module.exports = router;
