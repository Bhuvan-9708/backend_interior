const Project = require('../model/Project')
const fs = require('fs');
const path = require('path');

exports.createProject = async (req, res) => {
    try {
        const { projectName, projectShortDescription, sections, gallery, projectDetails, additionalMedia } = req.body;
        const project_slug = projectName.toLowerCase().replace(/ /g, '-');

        const projectImage = req.files.find(file => file.fieldname === 'projectImage');
        const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages');

        if (!projectImage || !projectName || !projectShortDescription || !sections || !gallery || !projectDetails || !additionalMedia) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields or images',
                details: {
                    projectImage: projectImage ? 'Present' : 'Not Present',
                    projectName: projectName ? 'Present' : 'Not Present',
                    projectShortDescription: projectShortDescription ? 'Present' : 'Not Present',
                    sections: sections ? 'Present' : 'Not Present',
                    gallery: gallery ? 'Present' : 'Not Present',
                    projectDetails: projectDetails ? 'Present' : 'Not Present',
                    additionalMedia: additionalMedia ? 'Present' : 'Not Present'
                }
            });
        }

        const projectImagePath = path.join(__dirname, '../uploads/', projectImage.filename);

        const galleryImagesPaths = galleryImages.map(file => path.join(__dirname, '../uploads/', file.filename));

        // Parse JSON fields
        const parsedSections = JSON.parse(sections);
        const parsedGallery = JSON.parse(gallery);
        const parsedProjectDetails = JSON.parse(projectDetails);
        const parsedAdditionalMedia = JSON.parse(additionalMedia);

        // Create a new project instance
        const project = new Project({
            projectName,
            projectShortDescription,
            projectImage: projectImagePath,
            sections: {
                mainHeading: parsedSections.mainHeading,
                sub_sections_one: {
                    title: parsedSections.sub_sections_one.title,
                    description: parsedSections.sub_sections_one.description
                },
                sub_sections_two: {
                    title: parsedSections.sub_sections_two.title,
                    description: parsedSections.sub_sections_two.description
                },
                sub_sections_three: {
                    title: parsedSections.sub_sections_three.title,
                    description: parsedSections.sub_sections_three.description
                }
            },
            gallery: {
                heading: parsedGallery.heading,
                subheading: parsedGallery.subheading,
                images: galleryImagesPaths
            },
            projectDetails: {
                heading: parsedProjectDetails.heading,
                subheading: parsedProjectDetails.subheading,
                videoURL: parsedProjectDetails.videoURL
            },
            additionalMedia: {
                title: parsedAdditionalMedia.title,
                headingDescription: parsedAdditionalMedia.headingDescription,
                description: parsedAdditionalMedia.description,
                videoLink: parsedAdditionalMedia.videoLink
            },
            project_slug
        });

        // Save the project
        const newProject = await project.save();

        res.status(201).json({ success: true, message: 'Project created successfully', data: newProject });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to create project', error: err.message });
    }
};

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

// Update a project
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectName, projectShortDescription, sections, gallery, projectDetails, additionalMedia } = req.body;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // Handle single project image
        const projectImage = req.files.find(file => file.fieldname === 'projectImage');
        if (projectImage) {
            if (project.projectImage) {
                // Remove old image
                fs.unlink(path.join(__dirname, '../uploads/', path.basename(project.projectImage)), (err) => {
                    if (err) console.error('Error removing old project image:', err);
                });
            }
            project.projectImage = path.join(__dirname, '../uploads/', projectImage.filename);
        }

        // Handle multiple gallery images
        const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages');
        if (galleryImages.length > 0) {
            if (project.gallery && project.gallery.images) {
                // Remove old gallery images
                project.gallery.images.forEach(imgPath => {
                    fs.unlink(path.join(__dirname, '../uploads/', path.basename(imgPath)), (err) => {
                        if (err) console.error('Error removing old gallery image:', err);
                    });
                });
            }
            project.gallery.images = galleryImages.map(file => path.join(__dirname, '../uploads/', file.filename));
        }

        // Update text fields if they exist in request body
        if (projectName) {
            project.projectName = projectName;
            // Automatically update slug when projectName is updated
            project.project_slug = projectName.toLowerCase().replace(/ /g, '-');
        }

        if (projectShortDescription) project.projectShortDescription = projectShortDescription;

        // Parse and update JSON sections, gallery, project details, and additional media
        if (sections) {
            const parsedSections = JSON.parse(sections);
            project.sections = {
                mainHeading: parsedSections.mainHeading,
                sub_sections_one: {
                    title: parsedSections.sub_sections_one?.title,
                    description: parsedSections.sub_sections_one?.description
                },
                sub_sections_two: {
                    title: parsedSections.sub_sections_two?.title,
                    description: parsedSections.sub_sections_two?.description
                },
                sub_sections_three: {
                    title: parsedSections.sub_sections_three?.title,
                    description: parsedSections.sub_sections_three?.description
                }
            };
        }

        if (gallery) {
            const parsedGallery = JSON.parse(gallery);
            project.gallery.heading = parsedGallery.heading;
            project.gallery.subheading = parsedGallery.subheading;
        }

        if (projectDetails) {
            const parsedProjectDetails = JSON.parse(projectDetails);
            project.projectDetails = {
                heading: parsedProjectDetails.heading,
                subheading: parsedProjectDetails.subheading,
                videoURL: parsedProjectDetails.videoURL
            };
        }

        if (additionalMedia) {
            const parsedAdditionalMedia = JSON.parse(additionalMedia);
            project.additionalMedia = {
                title: parsedAdditionalMedia.title,
                headingDescription: parsedAdditionalMedia.headingDescription,
                description: parsedAdditionalMedia.description,
                videoLink: parsedAdditionalMedia.videoLink
            };
        }

        // Save the updated project
        const updatedProject = await project.save();
        res.status(200).json({ success: true, message: 'Project updated successfully', data: updatedProject });
    } catch (err) {
        console.error(err);
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
