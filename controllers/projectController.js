const Project = require('../model/project');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get a single project
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Create a new project
exports.createProject = async (req, res) => {

    upload.single('project_image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        const project = new Project({
            project_title: req.body.project_title,
            project_description: req.body.project_description,
            project_image: req.file ? req.file.path : null
        });

        try {
            const newProject = await project.save();
            res.status(201).json(newProject);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });
};

// Update a project
exports.updateProject = async (req, res) => {
    try {

        const { id } = req.params;
        const { project_title, project_description } = req.body;
        const file = req.file

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        project.project_title = project_title || project.project_title;
        project.project_description = project_description || Project.project_description

        if (file) {
            if (project.project_image) {
                const oldFile = path.join(__dirname, '..', 'uploads', project.project_image);
                fs.unlink(oldFile, err => {
                    if (err) console.error('Error removing old image:', err);
                });
            }
            project.project_image = file.filename; // Update the image filename
        }
        await project.save();
        res.status(200).json(project)
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: err.message });
    }
};

// Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const result = await Project.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
