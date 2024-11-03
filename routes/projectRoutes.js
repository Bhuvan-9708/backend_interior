const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ProjectController = require("../controllers/projectController");

router.get('/projects/:slug?', ProjectController.handleProjects);   
router.get('/projects', ProjectController.handleProjects);
router.get('/projects/type/:type', ProjectController.handleProjects);
router.get('/project-types', ProjectController.getAllProjectTypes);

router.post('/create-project', upload.any(), ProjectController.createProject);
router.put('/update-project/:id', upload.any(), ProjectController.updateProject);
router.delete('/delete-project/:id', ProjectController.deleteProject);

module.exports = router;
