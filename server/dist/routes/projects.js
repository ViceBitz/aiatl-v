import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Feature } from '../models/Feature.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
router.use(authenticateToken);
// List user's projects
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const projects = await Project.find({ userId }).sort({ createdAt: -1 });
        res.json(projects.map((p) => ({
            id: p._id,
            _id: p._id,
            userId: p.userId,
            repoId: p.repoId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        })));
    }
    catch (error) {
        console.error('Error listing projects:', error);
        res.status(500).json({ error: error.message || 'Failed to list projects' });
    }
});
// Get project by ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const project = await Project.findOne({ _id: id, userId });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({
            id: project._id,
            _id: project._id,
            userId: project.userId,
            repoId: project.repoId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        });
    }
    catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({ error: error.message || 'Failed to get project' });
    }
});
// Create project
router.post('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { repoId } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!repoId) {
            return res.status(400).json({ error: 'repoId is required' });
        }
        // Check if project already exists
        let project = await Project.findOne({ userId, repoId });
        if (!project) {
            project = new Project({
                userId,
                repoId,
            });
            await project.save();
        }
        res.status(201).json({
            id: project._id,
            _id: project._id,
            userId: project.userId,
            repoId: project.repoId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        });
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: error.message || 'Failed to create project' });
    }
});
// Get features for a project
router.get('/:projectId/features', async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Verify project belongs to user
        const project = await Project.findOne({ _id: projectId, userId });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        const features = await Feature.find({ projectId }).populate('neighbors', 'featureName');
        res.json(features.map((f) => ({
            id: f._id,
            _id: f._id,
            projectId: f.projectId,
            featureName: f.featureName,
            userSummary: f.userSummary,
            aiSummary: f.aiSummary,
            filenames: f.filenames,
            neighbors: f.neighbors.map((n) => n._id || n),
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
        })));
    }
    catch (error) {
        console.error('Error getting features:', error);
        res.status(500).json({ error: error.message || 'Failed to get features' });
    }
});
// Create/update features (bulk)
router.post('/:projectId/features', async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        const { features } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Verify project belongs to user
        const project = await Project.findOne({ _id: projectId, userId });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (!Array.isArray(features)) {
            return res.status(400).json({ error: 'features must be an array' });
        }
        const savedFeatures = [];
        const existingFeatures = await Feature.find({ projectId });
        const existingFeaturesMap = new Map(existingFeatures.map((f) => [f.featureName, f]));
        for (const featureData of features) {
            const existingFeature = existingFeaturesMap.get(featureData.name || featureData.featureName);
            if (existingFeature) {
                existingFeature.featureName = featureData.name || featureData.featureName;
                existingFeature.userSummary = featureData.user_description || featureData.userSummary || '';
                existingFeature.aiSummary = featureData.technical_description || featureData.aiSummary || '';
                existingFeature.filenames = featureData.file_references || featureData.filenames || [];
                await existingFeature.save();
                savedFeatures.push(existingFeature);
            }
            else {
                const feature = new Feature({
                    projectId: project._id,
                    featureName: featureData.name || featureData.featureName,
                    userSummary: featureData.user_description || featureData.userSummary || '',
                    aiSummary: featureData.technical_description || featureData.aiSummary || '',
                    filenames: featureData.file_references || featureData.filenames || [],
                    neighbors: [],
                });
                await feature.save();
                savedFeatures.push(feature);
            }
        }
        res.json({
            success: true,
            featuresSaved: savedFeatures.length,
            features: savedFeatures.map((f) => ({
                id: f._id,
                _id: f._id,
                projectId: f.projectId,
                featureName: f.featureName,
                userSummary: f.userSummary,
                aiSummary: f.aiSummary,
                filenames: f.filenames,
                neighbors: f.neighbors,
            })),
        });
    }
    catch (error) {
        console.error('Error saving features:', error);
        res.status(500).json({ error: error.message || 'Failed to save features' });
    }
});
export default router;
