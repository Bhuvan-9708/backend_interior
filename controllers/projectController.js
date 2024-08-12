const Project = require('../model/project');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).json({
            success: true,
            message: 'Projects retrieved successfully',
            data: projects
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Failed to retrieve projects',
            error: err.message
        });
    }
};

// Get a single project
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({
            success: false,
            message: 'Project not found'
        });
        res.status(200).json({
            success: true,
            message: 'Project retrieved successfully',
            data: project
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Failed to retrieve project',
            error: err.message
        });
    }
};

// Create a new project
exports.createProject = async (req, res) => {
    try {
        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Check required fields
        if (!req.body.project_title || !req.body.project_description) {
            return res.status(400).json({
                success: false,
                message: 'Project title and description are required'
            });
        }

        // Create a new project
        const project = new Project({
            project_title: req.body.project_title,
            project_description: req.body.project_description,
            project_image: req.file.path // Store file path
        });

        // Save the project to the database
        const newProject = await project.save();

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: newProject
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create project',
            error: err.message
        });
    }
};

// Update a project
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { project_title, project_description } = req.body;
        const file = req.file;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Update fields if new values are provided
        if (project_title) {
            project.project_title = project_title;
        }
        if (project_description) {
            project.project_description = project_description;
        }

        // Handle file upload
        if (file) {
            // Remove old file if it exists
            if (project.project_image) {
                const oldFilePath = path.join(__dirname, '..', 'uploads', path.basename(project.project_image));
                fs.unlink(oldFilePath, err => {
                    if (err) console.error('Error removing old image:', err);
                });
            }
            project.project_image = file.path; // Update the image path
        }

        // Save the updated project
        await project.save();

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (err) {
        console.error('Error:', err); // Better error logging
        res.status(400).json({
            success: false,
            message: 'Error updating project',
            error: err.message
        });
    }
};

// Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const result = await Project.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({
            success: false,
            message: 'Project not found'
        });
        res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: 'Failed to delete project',
            error: err.message
        });
    }
};
