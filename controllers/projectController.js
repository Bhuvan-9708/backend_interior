const Project = require('../model/project');
const fs = require('fs');
const path = require('path');

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).json({ success: true, message: 'Projects retrieved successfully', data: projects });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to retrieve projects', error: err.message });
    }
};

// Get a single project
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        res.status(200).json({ success: true, message: 'Project retrieved successfully', data: project });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to retrieve project', error: err.message });
    }
};

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const { project_title, project_description } = req.body;
        if (!req.file || !project_title || !project_description) {
            return res.status(400).json({ success: false, message: 'No file uploaded or missing fields' });
        }
        const project = new Project({
            project_title, project_description, project_image: req.file.path
        });
        const newProject = await project.save();
        res.status(201).json({ success: true, message: 'Project created successfully', data: newProject });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create project', error: err.message });
    }
};

// Update a project
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { project_title, project_description } = req.body;
        const file = req.file;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        if (project_title) project.project_title = project_title;
        if (project_description) project.project_description = project_description;

        if (file) {
            if (project.project_image) {
                fs.unlink(path.join(__dirname, '..', 'uploads', path.basename(project.project_image)), err => {
                    if (err) console.error('Error removing old image:', err);
                });
            }
            project.project_image = file.path;
        }

        const updatedProject = await project.save();
        res.status(200).json({ success: true, message: 'Project updated successfully', data: updatedProject });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update project', error: err.message });
    }
};

// Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const result = await Project.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Project not found' });
        res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to delete project', error: err.message });
    }
};
