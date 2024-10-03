const Project = require('../model/project')
const ProjectType = require('../model/projectType');
const fs = require('fs');
const path = require('path');

exports.createProject = async (req, res) => {
    try {
        const { projectName, projectShortDescription, sections, gallery, projectDetails, additionalMedia, projectType, type_description } = req.body;
        const project_slug = projectName.toLowerCase().replace(/ /g, '-');

        const projectImage = req.files.find(file => file.fieldname === 'projectImage');
        const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages');

        let projectTypeRecord = await ProjectType.findOne({ project_type: projectType });
        if (!projectTypeRecord) {
            projectTypeRecord = new ProjectType({
                project_type: projectType,
                type_description
            });
            await projectTypeRecord.save();
        }

        const projectImagePath = path.join(__dirname, '../uploads/', projectImage.filename);
        const galleryImagesPaths = galleryImages.map(file => path.join(__dirname, '../uploads/', file.filename));

        const parsedSections = JSON.parse(sections);
        const parsedGallery = JSON.parse(gallery);
        const parsedProjectDetails = JSON.parse(projectDetails);
        const parsedAdditionalMedia = JSON.parse(additionalMedia);

        const project = new Project({
            projectName,
            projectShortDescription,
            projectImage: projectImagePath,
            sections: {
                mainHeading: parsedSections.mainHeading,
                sub_sections_one: parsedSections.sub_sections_one,
                sub_sections_two: parsedSections.sub_sections_two,
                sub_sections_three: parsedSections.sub_sections_three
            },
            gallery: {
                heading: parsedGallery.heading,
                subheading: parsedGallery.subheading,
                images: galleryImagesPaths
            },
            projectDetails: parsedProjectDetails,
            additionalMedia: parsedAdditionalMedia,
            project_slug,
            projectType: projectTypeRecord._id
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
