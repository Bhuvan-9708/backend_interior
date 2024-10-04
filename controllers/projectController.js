const Project = require('../model/project')
const ProjectType = require('../model/projectType');
const { uploadToCloudinary } = require("../middleware/cloudinaryConfig.js");
const mongoose = require('mongoose');
exports.createProject = async (req, res) => {
    try {
        const { projectName, projectShortDescription, sections, gallery, projectDetails, additionalMedia, projectType, type_description } = req.body;
        const project_slug = projectName.toLowerCase().replace(/ /g, '-');

        // Separate project image and gallery images
        const projectImage = req.files.find(file => file.fieldname === 'projectImage');
        const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages');

        // Initialize projectTypeRecord
        let projectTypeRecord;

        if (projectType) {
            // Check if the projectType is a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(projectType)) {
                // Check if the project type exists (existing type)
                projectTypeRecord = await ProjectType.findOne({ _id: projectType });

                if (!projectTypeRecord) {
                    return res.status(400).json({ success: false, message: 'Invalid project type' });
                }
            } else {
                // If projectType is not a valid ObjectId, assume it's a new type (string value for new project type)
                if (!type_description) {
                    return res.status(400).json({ success: false, message: 'Type description is required for new project types' });
                }

                // Create a new project type if it doesn't exist
                projectTypeRecord = new ProjectType({
                    project_type: projectType, // This is the name for new type
                    type_description
                });
                await projectTypeRecord.save();
            }
        }

        // Ensure projectTypeRecord is defined
        if (!projectTypeRecord) {
            return res.status(400).json({ success: false, message: 'Project type is required' });
        }

        // Upload project image to Cloudinary
        const projectImageUpload = await uploadToCloudinary(projectImage.buffer, 'project-images');

        // Upload gallery images to Cloudinary
        const galleryImagesUpload = await Promise.all(galleryImages.map(async (file) => {
            const result = await uploadToCloudinary(file.buffer, 'project-images');
            return result.secure_url;
        }));

        // Parse JSON fields
        const parsedSections = JSON.parse(sections);
        const parsedGallery = JSON.parse(gallery);
        const parsedProjectDetails = JSON.parse(projectDetails);
        const parsedAdditionalMedia = JSON.parse(additionalMedia);

        // Create new project
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
            projectType: projectTypeRecord._id // Use the ObjectId of the project type
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

        const projectImage = req.files.find(file => file.fieldname === 'projectImage');
        if (projectImage) {
            if (project.projectImage) {
            }
            const result = await uploadToCloudinary(projectImage.buffer, 'project-images');
            project.projectImage = result.secure_url;
        }

        const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages');
        if (galleryImages.length > 0) {
            if (project.gallery && project.gallery.images) {
                project.gallery.images.forEach(imgUrl => {
                });
            }
            const uploadedGalleryImages = await Promise.all(
                galleryImages.map(file => uploadToCloudinary(file.buffer, 'gallery-images'))
            );
            project.gallery.images = uploadedGalleryImages.map(result => result.secure_url);
        }

        if (projectName) {
            project.projectName = projectName;
            project.project_slug = projectName.toLowerCase().replace(/ /g, '-');
        }
        if (projectShortDescription) project.projectShortDescription = projectShortDescription;

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
