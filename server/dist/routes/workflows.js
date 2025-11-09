export {};
/*
import { Router } from 'express';
import { Octokit } from '@octokit/rest';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Feature } from '../models/Feature.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import fetch from 'node-fetch';

const router = Router();
router.use(authenticateToken);

// In-memory workflow execution store (in production, use Redis or database)
const workflowExecutions = new Map<string, any>();

// Start onboarding workflow
router.post('/onboarding', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { owner, repo, repoId, projectId, files, userId: inputUserId } = input;

    if (!owner || !repo || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Missing required fields: owner, repo, files' });
    }

    // Get user's GitHub token
    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub not connected' });
    }

    const executionArn = `execution-onboarding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Start workflow asynchronously
    executeOnboardingWorkflow(executionArn, {
      owner,
      repo,
      repoId,
      projectId,
      files,
      userId,
      githubToken: user.githubToken,
    }).catch((error) => {
      console.error('Workflow execution error:', error);
      workflowExecutions.set(executionArn, {
        status: 'FAILED',
        error: error.message,
      });
    });

    workflowExecutions.set(executionArn, {
      status: 'RUNNING',
      startDate: new Date().toISOString(),
    });

    res.json({
      executionArn,
      status: 'RUNNING',
    });
  } catch (error: any) {
    console.error('Error starting onboarding workflow:', error);
    res.status(500).json({ error: error.message || 'Failed to start workflow' });
  }
});

// Start modification workflow
router.post('/modification', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { userInput, owner, repo, featureMap } = input;

    if (!userInput || !owner || !repo) {
      return res.status(400).json({ error: 'Missing required fields: userInput, owner, repo' });
    }

    // Get user's GitHub token
    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub not connected' });
    }

    const executionArn = `execution-modification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Start workflow asynchronously
    executeModificationWorkflow(executionArn, {
      userInput,
      owner,
      repo,
      featureMap: featureMap || [],
      userId,
      githubToken: user.githubToken,
    }).catch((error) => {
      console.error('Workflow execution error:', error);
      workflowExecutions.set(executionArn, {
        status: 'FAILED',
        error: error.message,
      });
    });

    workflowExecutions.set(executionArn, {
      status: 'RUNNING',
      startDate: new Date().toISOString(),
    });

    res.json({
      executionArn,
      status: 'RUNNING',
    });
  } catch (error: any) {
    console.error('Error starting modification workflow:', error);
    res.status(500).json({ error: error.message || 'Failed to start workflow' });
  }
});

// Get workflow status
router.get('/status/:executionArn', async (req: AuthRequest, res) => {
  try {
    const { executionArn } = req.params;
    const execution = workflowExecutions.get(executionArn);

    if (!execution) {
      return res.status(404).json({ error: 'Workflow execution not found' });
    }

    res.json(execution);
  } catch (error: any) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({ error: error.message || 'Failed to get workflow status' });
  }
});

// Helper function to execute onboarding workflow
async function executeOnboardingWorkflow(executionArn: string, input: any) {
  const API_URL = process.env.API_URL || 'http://aiatl-v.vercel.app';
  const octokit = new Octokit({ auth: input.githubToken });

  try {
    const features: any[] = [];

    // Process each file
    for (const file of input.files) {
      try {
        // Get file content
        const { data } = await octokit.repos.getContent({
          owner: input.owner,
          repo: input.repo,
          path: file.path,
        });

        if (Array.isArray(data) || data.type !== 'file') {
          continue;
        }

        const content = Buffer.from(data.content, 'base64').toString('utf-8');

        // Call Gemini to extract features
        const geminiResponse = await fetch(`${API_URL}/api/gemini/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${input.userId}`, // Simplified - use proper auth
          },
          body: JSON.stringify({
            promptType: 1,
            input: JSON.stringify({ path: file.path, content }),
            context: {
              currentFeatureMap: JSON.stringify(features),
              fileName: file.path,
            },
          }),
        });

        const featureData = await geminiResponse.json();
        if (featureData.features) {
          features.push(...featureData.features);
        }
      } catch (error: any) {
        console.error(`Error processing file ${file.path}:`, error.message);
      }
    }

    // Generate relationships
    let relationships: any = { features, relationships: [] };
    try {
      const relationshipResponse = await fetch(`${API_URL}/api/gemini/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.userId}`,
        },
        body: JSON.stringify({
          promptType: 2,
          input: JSON.stringify(features),
          context: {},
        }),
      });

      const relationshipData = await relationshipResponse.json();
      if (relationshipData.relationships) {
        relationships.relationships = relationshipData.relationships;
      }
    } catch (error: any) {
      console.error('Error generating relationships:', error);
    }

    // Save features to database
    if (input.projectId) {
      await saveFeatureMap(input.projectId, relationships);
    }

    workflowExecutions.set(executionArn, {
      status: 'SUCCEEDED',
      output: {
        message: 'Feature map generated successfully',
        featuresSaved: features.length,
      },
    });
  } catch (error: any) {
    workflowExecutions.set(executionArn, {
      status: 'FAILED',
      error: error.message,
    });
  }
}

// Helper function to execute modification workflow
async function executeModificationWorkflow(executionArn: string, input: any) {
  const API_URL = process.env.API_URL || 'http://aiatl-v.vercel.app';

  try {
    // Step 1: Gather context
    const contextResponse = await fetch(`${API_URL}/api/gemini/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.userId}`,
      },
      body: JSON.stringify({
        promptType: 3,
        input: input.userInput,
        context: {
          featureMap: JSON.stringify(input.featureMap),
        },
      }),
    });

    const contextData = await contextResponse.json();
    const requestedFiles = contextData.requestedFiles || [];

    // Step 2: Fetch files
    const octokit = new Octokit({ auth: input.githubToken });
    const fileContents: any[] = [];

    for (const filePath of requestedFiles) {
      try {
        const { data } = await octokit.repos.getContent({
          owner: input.owner,
          repo: input.repo,
          path: filePath,
        });

        if (Array.isArray(data) || data.type !== 'file') {
          continue;
        }

        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        fileContents.push({
          path: filePath,
          content,
          sha: data.sha,
        });
      } catch (error: any) {
        console.error(`Error fetching file ${filePath}:`, error);
      }
    }

    // Step 3: Generate code changes
    const codeResponse = await fetch(`${API_URL}/api/gemini/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.userId}`,
      },
      body: JSON.stringify({
        promptType: 4,
        input: input.userInput,
        context: {
          fileContents: JSON.stringify(fileContents),
          featureMap: JSON.stringify(input.featureMap),
          githubToken: input.githubToken,
        },
      }),
    });

    const codeData = await codeResponse.json();

    workflowExecutions.set(executionArn, {
      status: 'SUCCEEDED',
      output: {
        message: codeData.message || 'Code changes applied',
        commits: codeData.commits || [],
      },
    });
  } catch (error: any) {
    workflowExecutions.set(executionArn, {
      status: 'FAILED',
      error: error.message,
    });
  }
}

// Helper function to save feature map
async function saveFeatureMap(projectId: string, featureData: any) {
  const featuresList = featureData.features || [];

  // Get or create project
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Get existing features
  const existingFeatures = await Feature.find({ projectId });
  const existingFeaturesMap = new Map(existingFeatures.map((f) => [f.featureName, f]));

  // Process each feature
  const savedFeatures: any[] = [];
  for (const featureData of featuresList) {
    const existingFeature = existingFeaturesMap.get(featureData.name);

    if (existingFeature) {
      // Update existing feature
      existingFeature.featureName = featureData.name;
      existingFeature.userSummary = featureData.user_description || featureData.userSummary || '';
      existingFeature.aiSummary = featureData.technical_description || featureData.aiSummary || '';
      existingFeature.filenames = featureData.file_references || featureData.filenames || [];
      await existingFeature.save();
      savedFeatures.push(existingFeature);
    } else {
      // Create new feature
      const feature = new Feature({
        projectId: project._id,
        featureName: featureData.name,
        userSummary: featureData.user_description || featureData.userSummary || '',
        aiSummary: featureData.technical_description || featureData.aiSummary || '',
        filenames: featureData.file_references || featureData.filenames || [],
        neighbors: [],
      });
      await feature.save();
      savedFeatures.push(feature);
    }
  }

  // Update neighbors based on relationships
  if (featureData.relationships) {
    const featuresByName = new Map(savedFeatures.map((f) => [f.featureName, f]));

    for (const relationship of featureData.relationships) {
      const sourceFeature = featuresByName.get(relationship.source);
      const targetFeature = featuresByName.get(relationship.target);

      if (sourceFeature && targetFeature) {
        const neighbors = sourceFeature.neighbors || [];
        const targetId = targetFeature._id;
        if (targetId && !neighbors.some((n: any) => n.toString() === targetId.toString())) {
          neighbors.push(targetId);
          sourceFeature.neighbors = neighbors;
          await sourceFeature.save();
        }
      }
    }
  }
}

export default router;
*/ 
