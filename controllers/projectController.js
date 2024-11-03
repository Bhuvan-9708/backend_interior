const Project = require('../model/project')
const ProjectType = require('../model/projectType');
const mongoose = require('mongoose');
const path = require('path');

exports.createProject = async (req, res) => {
    console.log("project", req.body);
    console.log("files", req.files);
    try {
        const { projectName, projectShortDescription, sections, gallery, projectDetails, additionalMedia, projectType, type_description } = req.body;

        // Validate required fields
        if (!projectName) {
            return res.status(400).json({ success: false, message: 'Project name is required' });
        }
        if (!projectType) {
            return res.status(400).json({ success: false, message: 'Project type is required' });
        }

        // Generate slug
        const project_slug = projectName.toLowerCase().replace(/ /g, '-');

        // Validate and parse sections and gallery data if present
        let parsedSections = {};
        let parsedGallery = {};

        if (sections) {
            try {
                parsedSections = JSON.parse(sections);
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Invalid JSON format for sections' });
            }
        }
        if (gallery) {
            try {
                parsedGallery = JSON.parse(gallery);
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Invalid JSON format for gallery' });
            }
        }

        // Handle file uploads
        const projectImageFile = req.files.find(file => file.fieldname === 'projectImage');
        const projectImage = projectImageFile ? projectImageFile.path : null;
        const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages').map(file => file.path);
        const additionalImageFile = req.files.find(file => file.fieldname === 'additionalImage');
        const additionalImage = additionalImageFile ? additionalImageFile.path : null;

        // Validate or create project type record
        let projectTypeRecord;
        if (mongoose.Types.ObjectId.isValid(projectType)) {
            projectTypeRecord = await ProjectType.findById(projectType);
            if (!projectTypeRecord) {
                return res.status(400).json({ success: false, message: 'Invalid project type ID' });
            }
        } else {
            if (!type_description) {
                return res.status(400).json({ success: false, message: 'Type description is required for new project types' });
            }
            projectTypeRecord = new ProjectType({ project_type: projectType, type_description });
            await projectTypeRecord.save();
        }

        const parsedProjectDetails = projectDetails ? JSON.parse(projectDetails) : {};
        const parsedAdditionalMedia = additionalMedia ? JSON.parse(additionalMedia) : {};

        parsedAdditionalMedia.additional_image = additionalImage || null;

        const project = new Project({
            projectName,
            projectShortDescription,
            projectImage,
            project_slug,
            sections: {
                mainHeading: parsedSections.mainHeading || '',
                sub_sections_one: parsedSections.sub_sections_one || {},
                sub_sections_two: parsedSections.sub_sections_two || {},
                sub_sections_three: parsedSections.sub_sections_three || {}
            },
            gallery: {
                heading: parsedGallery.heading || '',
                subheading: parsedGallery.subheading || '',
                images: galleryImages
            },
            projectDetails: parsedProjectDetails,
            additionalMedia: parsedAdditionalMedia,
            projectType: projectTypeRecord._id
        });

        // Save the new project
        const newProject = await project.save();
        res.status(201).json({ success: true, message: 'Project created successfully', data: newProject });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to create project', error: err.message });
    }
};


// Get all projects
exports.handleProjects = async (req, res) => {
    try {
        if (req.params.slug) {
            const project = await Project.findOne({ project_slug: req.params.slug })
                .populate('projectType', 'project_type type_description');

            if (!project) {
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            return res.status(200).json({ success: true, message: 'Project retrieved successfully', data: project });
        }

        if (req.params.type) {
            const projects = await Project.find({ projectType: req.params.type })
                .populate('projectType', 'project_type type_description');

            if (!projects.length) {
                return res.status(404).json({ success: false, message: 'No projects found for this type' });
            }

            return res.status(200).json({ success: true, message: 'Projects retrieved successfully', data: projects });
        }

        const projects = await Project.find()
            .populate('projectType', 'project_type type_description');

        res.status(200).json({ success: true, message: 'Projects retrieved successfully', data: projects });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to retrieve projects', error: err.message });
    }
};

exports.getAllProjectTypes = async (req, res) => {
    try {
        const projectTypes = await ProjectType.find({}, 'project_type type_description');
        res.status(200).json({ success: true, message: 'Project types retrieved successfully', data: projectTypes });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to retrieve project types', error: err.message });
    }
};
// Update a project
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectName, projectShortDescription, sections, gallery, projectDetails, additionalMedia } = req.body;

        // Find the existing project by ID
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // Update the project image if provided
        const projectImage = req.files.find(file => file.fieldname === 'projectImage');
        if (projectImage) {
            project.projectImage = projectImage.path; // Use local file path
        } else if (req.body.removeProjectImage) {
            project.projectImage = null; // Reset project image if requested
        }

        // Handle gallery images if new ones are uploaded
        const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages');
        if (galleryImages.length > 0) {
            project.gallery.images.push(...galleryImages.map(file => file.path)); // Add new images
        }

        // Remove specific gallery images if requested
        if (req.body.removeGalleryImages) {
            const imagesToRemove = JSON.parse(req.body.removeGalleryImages); // Expecting an array of image paths to remove
            project.gallery.images = project.gallery.images.filter(image => !imagesToRemove.includes(image));
        }

        // Update project details
        if (projectName) {
            project.projectName = projectName;
            project.project_slug = projectName.toLowerCase().replace(/ /g, '-');
        }
        if (projectShortDescription) project.projectShortDescription = projectShortDescription;

        // Update sections if provided
        if (sections) {
            const parsedSections = JSON.parse(sections);
            project.sections = {
                mainHeading: parsedSections.mainHeading || project.sections.mainHeading,
                sub_sections_one: {
                    title: parsedSections.sub_sections_one?.title || project.sections.sub_sections_one.title,
                    description: parsedSections.sub_sections_one?.description || project.sections.sub_sections_one.description
                },
                sub_sections_two: {
                    title: parsedSections.sub_sections_two?.title || project.sections.sub_sections_two.title,
                    description: parsedSections.sub_sections_two?.description || project.sections.sub_sections_two.description
                },
                sub_sections_three: {
                    title: parsedSections.sub_sections_three?.title || project.sections.sub_sections_three.title,
                    description: parsedSections.sub_sections_three?.description || project.sections.sub_sections_three.description
                }
            };
        }

        // Update gallery headings if provided
        if (gallery) {
            const parsedGallery = JSON.parse(gallery);
            project.gallery.heading = parsedGallery.heading || project.gallery.heading;
            project.gallery.subheading = parsedGallery.subheading || project.gallery.subheading;
        }

        if (projectDetails) {
            const parsedProjectDetails = JSON.parse(projectDetails);
            project.projectDetails = {
                heading: parsedProjectDetails.heading || project.projectDetails.heading,
                subheading: parsedProjectDetails.subheading || project.projectDetails.subheading,
                videoURL: parsedProjectDetails.videoURL || project.projectDetails.videoURL
            };
        }

        // Handle additional media updates
        if (additionalMedia) {
            const parsedAdditionalMedia = JSON.parse(additionalMedia);
            const additionalImage = req.files.find(file => file.fieldname === 'additionalImage');

            if (additionalImage) {
                project.additionalMedia.additional_image = additionalImage.path; // Update with the new image path
            }

            project.additionalMedia = {
                title: parsedAdditionalMedia.title || project.additionalMedia.title,
                headingDescription: parsedAdditionalMedia.headingDescription || project.additionalMedia.headingDescription,
                description: parsedAdditionalMedia.description || project.additionalMedia.description,
                additional_image: project.additionalMedia.additional_image // Keep the existing image if no new image is provided
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
