const Project = require('../model/project')
const ProjectType = require('../model/projectType');
const { uploadToCloudinary } = require("../middleware/cloudinaryConfig.js");
const mongoose = require('mongoose');
exports.createProject = async (req, res) => {
    console.log('Request Body:', req.body);
    console.log('Uploaded Files:', req.files);

    try {
        const { projectName, projectShortDescription, sections, gallery, projectDetails, additionalMedia, projectType, type_description } = req.body;
        const project_slug = projectName.toLowerCase().replace(/ /g, '-');

        const projectImage = req.files.find(file => file.fieldname === 'projectImage');
        const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages');
        const additionalImage = req.files.find(file => file.fieldname === 'additionalImage');

        let projectTypeRecord;

        // Check if a projectType is provided (either existing or new)
        if (projectType) {
            // Check if projectType is a valid ObjectId (existing type)
            if (mongoose.Types.ObjectId.isValid(projectType)) {
                projectTypeRecord = await ProjectType.findOne({ _id: projectType });

                if (!projectTypeRecord) {
                    return res.status(400).json({ success: false, message: 'Invalid project type' });
                }
            } else {
                // If projectType is a new type, type_description must be provided
                if (!type_description || type_description.trim() === '') {
                    return res.status(400).json({ success: false, message: 'Type description is required for new project types' });
                }

                // Create new project type if description is provided
                projectTypeRecord = new ProjectType({
                    project_type: projectType, // This is the new project type name
                    type_description // Ensure this is included when creating a new type
                });
                await projectTypeRecord.save();
            }
        } else {
            // If no project type is provided, return an error
            return res.status(400).json({ success: false, message: 'Project type is required' });
        }

        // Proceed to upload project image, gallery, and additional media
        const projectImageUpload = await uploadToCloudinary(projectImage.buffer, 'project-images');

        const galleryImagesUpload = await Promise.all(galleryImages.map(async (file) => {
            const result = await uploadToCloudinary(file.buffer, 'project-images');
            return result.secure_url;
        }));

        let additionalImageUpload = null;
        if (additionalImage) {
            additionalImageUpload = await uploadToCloudinary(additionalImage.buffer, 'additional-media-images');
        }

        // Parse the sections, gallery, and additional details
        const parsedSections = JSON.parse(sections);
        const parsedGallery = JSON.parse(gallery);
        const parsedProjectDetails = projectDetails ? JSON.parse(projectDetails) : {};
        const parsedAdditionalMedia = additionalMedia ? JSON.parse(additionalMedia) : {};

        parsedAdditionalMedia.additional_image = additionalImageUpload ? additionalImageUpload.secure_url : null;

        // Create the project in the database
        const project = new Project({
            projectName,
            projectShortDescription,
            projectImage: projectImageUpload.secure_url,
            sections: {
                mainHeading: parsedSections.mainHeading,
                sub_sections_one: parsedSections.sub_sections_one,
                sub_sections_two: parsedSections.sub_sections_two,
                sub_sections_three: parsedSections.sub_sections_three
            },
            gallery: {
                heading: parsedGallery.heading,
                subheading: parsedGallery.subheading,
                images: galleryImagesUpload
            },
            projectDetails: parsedProjectDetails,
            additionalMedia: parsedAdditionalMedia,
            project_slug,
            projectType: projectTypeRecord._id // Associate the project with the project type
        });

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

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        // Handle project image upload or reset
        const projectImage = req.files.find(file => file.fieldname === 'projectImage');
        if (projectImage) {
            const result = await uploadToCloudinary(projectImage.buffer, 'project-images');
            project.projectImage = result.secure_url;
        } else if (!req.body.projectImage) {
            project.projectImage = null; // Reset if projectImage is not provided
        }

        // Handle gallery images
        const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages');
        if (galleryImages.length > 0) {
            const uploadedGalleryImages = await Promise.all(
                galleryImages.map(file => uploadToCloudinary(file.buffer, 'gallery-images'))
            );
            // Update existing images with new images
            project.gallery.images = [
                ...project.gallery.images, // Keep existing images
                ...uploadedGalleryImages.map(result => result.secure_url) // Add new images
            ];
        }

        // Check if gallery images should be removed (if provided)
        if (req.body.removeGalleryImages) {
            const imagesToRemove = JSON.parse(req.body.removeGalleryImages); // Expecting an array of image URLs to remove
            project.gallery.images = project.gallery.images.filter(image => !imagesToRemove.includes(image));
        }

        // Update project details
        if (projectName) {
            project.projectName = projectName;
            project.project_slug = projectName.toLowerCase().replace(/ /g, '-');
        }
        if (projectShortDescription) project.projectShortDescription = projectShortDescription;

        // Update sections
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

        // Update gallery headings
        if (gallery) {
            const parsedGallery = JSON.parse(gallery);
            project.gallery.heading = parsedGallery.heading;
            project.gallery.subheading = parsedGallery.subheading;
        }

        // Update project details
        if (projectDetails) {
            const parsedProjectDetails = JSON.parse(projectDetails);
            project.projectDetails = {
                heading: parsedProjectDetails.heading,
                subheading: parsedProjectDetails.subheading,
                videoURL: parsedProjectDetails.videoURL
            };
        }

        // Handle additional media
        if (additionalMedia) {
            const parsedAdditionalMedia = JSON.parse(additionalMedia);
            const additionalImage = req.files.find(file => file.fieldname === 'additionalImage');
            let additionalImageURL = null;

            if (additionalImage) {
                const result = await uploadToCloudinary(additionalImage.buffer, 'additional-media-images');
                additionalImageURL = result.secure_url;
            }

            project.additionalMedia = {
                title: parsedAdditionalMedia.title,
                headingDescription: parsedAdditionalMedia.headingDescription,
                description: parsedAdditionalMedia.description,
                additional_image: additionalImageURL || parsedAdditionalMedia.additional_image // Use new image if uploaded
            };
        }

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
