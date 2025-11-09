import { Router } from 'express';
import { Octokit } from '@octokit/rest';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get GitHub OAuth URL
router.get('/oauth/url', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GitHub client ID not configured' });
    }

    const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5173/auth/callback';
    const scopes = 'repo read:user user:email';
    const state = `${userId}-${Date.now()}`;

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;

    res.json({
      authUrl,
      state,
    });
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ error: error.message || 'Failed to generate OAuth URL' });
  }
});

// Handle GitHub OAuth callback
router.post('/oauth/callback', async (req: AuthRequest, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or userId' });
    }

    if (userId !== req.userId) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5173/auth/callback';

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'GitHub OAuth not configured' });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(400).json({ error: 'No access token received from GitHub' });
    }

    // Verify token by fetching user info
    const octokit = new Octokit({ auth: accessToken });
    const { data: userInfo } = await octokit.users.getAuthenticated();

    // Update user record with GitHub token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.githubToken = accessToken;
    await user.save();

    res.json({
      success: true,
      username: userInfo.login,
      message: 'GitHub connected successfully',
    });
  } catch (error: any) {
    console.error('Error in GitHub OAuth callback:', error);
    res.status(500).json({ error: error.message || 'Failed to connect GitHub' });
  }
});

// Check GitHub connection status
router.get('/status', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      connected: !!user.githubToken,
    });
  } catch (error: any) {
    console.error('Error checking GitHub status:', error);
    res.status(500).json({ error: error.message || 'Failed to check GitHub status' });
  }
});

// List GitHub repositories
router.get('/repos', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.githubToken) {
      return res.status(400).json({ error: 'GitHub not connected' });
    }

    const octokit = new Octokit({
      auth: user.githubToken,
    });

    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    const repos = data.map((repo) => ({
      id: repo.id,
      full_name: repo.full_name,
      private: repo.private,
      description: repo.description || '',
      language: repo.language || '',
      updated_at: repo.updated_at,
    }));

    res.json(repos);
  } catch (error: any) {
    console.error('Error fetching repos:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch repositories' });
  }
});

// Get repository files (recursive)
router.get('/repos/:owner/:repo/files', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { owner, repo } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub not connected' });
    }

    const octokit = new Octokit({
      auth: user.githubToken,
    });

    // Recursive function to get all files
    async function getRepoFiles(path: string = ''): Promise<any[]> {
      const files: any[] = [];

      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path,
        });

        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.type === 'file') {
              files.push({
                path: item.path,
                name: item.name,
                sha: item.sha,
                size: item.size,
              });
            } else if (item.type === 'dir') {
              const subFiles = await getRepoFiles(item.path);
              files.push(...subFiles);
            }
          }
        } else if (data.type === 'file') {
          files.push({
            path: data.path,
            name: data.name,
            sha: data.sha,
            size: data.size,
          });
        }
      } catch (error: any) {
        console.error(`Error getting files at path ${path}:`, error.message);
      }

      return files;
    }

    const files = await getRepoFiles();

    res.json({
      files,
      count: files.length,
    });
  } catch (error: any) {
    console.error('Error fetching repo files:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch repository files' });
  }
});

// Get file content
router.get('/repos/:owner/:repo/content', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { owner, repo } = req.params;
    const { path, ref = 'main' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub not connected' });
    }

    const octokit = new Octokit({
      auth: user.githubToken,
    });

    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: ref as string,
    });

    if (Array.isArray(data) || data.type !== 'file') {
      return res.status(400).json({ error: `Path ${path} is not a file` });
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    res.json({
      name: data.name,
      path: data.path,
      content: content,
      sha: data.sha,
    });
  } catch (error: any) {
    console.error('Error fetching file content:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch file content' });
  }
});

// Connect repository (create project)
router.post('/repos/connect', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { full_name } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!full_name) {
      return res.status(400).json({ error: 'Missing repository full_name' });
    }

    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub not connected' });
    }

    const repoId = full_name;

    res.json({
      success: true,
      projectId: "-1",
      message: `Repository ${full_name} connected.`,
    });
  } catch (error: any) {
    console.error('Error connecting repository:', error);
    res.status(500).json({ error: error.message || 'Failed to connect repository' });
  }
});

// Create webhook (placeholder - would need GitHub webhook setup)
router.post('/webhook', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { owner, repo } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // TODO: Implement webhook creation
    // This would require setting up GitHub webhooks and handling events
    res.json({
      success: true,
      message: 'Webhook creation not yet implemented',
    });
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: error.message || 'Failed to create webhook' });
  }
});

export default router;

