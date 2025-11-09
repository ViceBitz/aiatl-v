import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { Octokit } from '@octokit/rest';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { getPrompt } from '../utils/prompts.js';
const router = Router();
router.use(authenticateToken);
const githubFunctions = {
    get_file: async (octokit, { owner, repo, file_path, branch = 'main' }) => {
        try {
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path: file_path,
                ref: branch,
            });
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            return {
                content,
                sha: data.sha,
                path: file_path,
            };
        }
        catch (error) {
            return {
                error: `Failed to get file: ${error.message}`,
                content: null,
                sha: null,
                path: file_path,
            };
        }
    },
    update_file: async (octokit, { owner, repo, path, content, message, branch = 'main', sha }) => {
        try {
            const result = await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path,
                message,
                content: Buffer.from(content).toString('base64'),
                branch,
                sha,
            });
            return {
                success: true,
                commit: result.data.commit.html_url,
                sha: result.data.content?.sha,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update file: ${error.message}`,
            };
        }
    },
};
const functionDeclaration = [
    {
        name: 'get_file',
        description: 'Retrieve the file contents of a GitHub Repository',
        parameters: {
            type: Type.OBJECT,
            properties: {
                owner: { type: Type.STRING, description: 'Owner of the repository' },
                repo: { type: Type.STRING, description: 'Repository name' },
                file_path: { type: Type.STRING, description: 'Path to the file in the repository' },
                branch: { type: Type.STRING, description: 'Branch name (default: main)' },
            },
            required: ['owner', 'repo', 'file_path'],
        },
    },
    {
        name: 'update_file',
        description: 'Update the contents of a specific file in a GitHub repository.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                owner: { type: Type.STRING, description: 'Repository owner' },
                repo: { type: Type.STRING, description: 'Repository name' },
                path: { type: Type.STRING, description: 'File path' },
                content: { type: Type.STRING, description: 'New file content' },
                message: { type: Type.STRING, description: 'Commit message' },
                branch: { type: Type.STRING, description: 'Branch name (default: main)' },
                sha: { type: Type.STRING, description: 'File SHA from get_file (required for updates)' },
            },
            required: ['owner', 'repo', 'path', 'content', 'message', 'sha'],
        },
    },
    {
        name: 'add_feature',
        description: 'Add a new feature to the feature map',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'Feature name' },
                user_description: { type: Type.STRING, description: 'Non-technical description' },
                technical_description: { type: Type.STRING, description: 'Technical description' },
                file_references: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'List of file paths',
                },
            },
            required: ['name', 'user_description', 'technical_description', 'file_references'],
        },
    },
    {
        name: 'update_feature',
        description: 'Update an existing feature in the feature map',
        parameters: {
            type: Type.OBJECT,
            properties: {
                feature_id: { type: Type.STRING, description: 'ID of feature to update' },
                name: { type: Type.STRING, description: 'Feature name' },
                user_description: { type: Type.STRING, description: 'Non-technical description' },
                technical_description: { type: Type.STRING, description: 'Technical description' },
                file_references: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'List of file paths',
                },
            },
            required: ['feature_id'],
        },
    },
];
async function executeFunctionCall(call, octokit) {
    console.log(`Executing function: ${call.name}`, call.args);
    try {
        if (call.name === 'get_file') {
            if (!octokit) {
                return { error: 'GitHub token required for get_file' };
            }
            return await githubFunctions.get_file(octokit, call.args);
        }
        else if (call.name === 'update_file') {
            if (!octokit) {
                return { error: 'GitHub token required for update_file' };
            }
            return await githubFunctions.update_file(octokit, call.args);
        }
        else if (call.name === 'add_feature') {
            return {
                action: 'add',
                feature: call.args,
            };
        }
        else if (call.name === 'update_feature') {
            return {
                action: 'update',
                feature: call.args,
            };
        }
        return { error: `Unknown function: ${call.name}` };
    }
    catch (error) {
        return { error: error.message };
    }
}
// Gemini API endpoint
router.post('/generate', async (req, res) => {
    try {
        const { promptType, input, context } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const apiKey = process.env.GEMINI_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }
        const ai = new GoogleGenAI({ apiKey });
        // Get user's GitHub token if available
        const user = await User.findById(userId);
        let octokit = null;
        if (user?.githubToken) {
            octokit = new Octokit({ auth: user.githubToken });
        }
        // Load the appropriate prompt
        const promptTemplate = getPrompt(promptType || 1);
        // Prepare input based on prompt type (same logic as original handler)
        let inputText = '';
        if (promptType === 1) {
            if (typeof input === 'string') {
                try {
                    const parsed = JSON.parse(input);
                    if (parsed.content) {
                        inputText = `File: ${parsed.path || context?.fileName || 'unknown'}\n\n${parsed.content}`;
                    }
                    else {
                        inputText = input;
                    }
                }
                catch {
                    inputText = input;
                }
            }
            else {
                inputText = JSON.stringify(input);
            }
            if (context?.currentFeatureMap) {
                try {
                    const featureMap = typeof context.currentFeatureMap === 'string' ? JSON.parse(context.currentFeatureMap) : context.currentFeatureMap;
                    inputText += `\n\nCurrent feature map:\n${JSON.stringify(featureMap, null, 2)}`;
                }
                catch {
                    // Ignore parsing errors
                }
            }
        }
        else if (promptType === 2) {
            inputText = typeof input === 'string' ? input : JSON.stringify(input);
        }
        else if (promptType === 3) {
            inputText = typeof input === 'string' ? input : JSON.stringify(input);
            if (context?.featureMap) {
                try {
                    const featureMap = typeof context.featureMap === 'string' ? JSON.parse(context.featureMap) : context.featureMap;
                    inputText += `\n\nAvailable features:\n${JSON.stringify(featureMap, null, 2)}`;
                }
                catch {
                    // Ignore parsing errors
                }
            }
        }
        else if (promptType === 4) {
            inputText = typeof input === 'string' ? input : JSON.stringify(input);
            if (context?.fileContents) {
                try {
                    const files = typeof context.fileContents === 'string' ? JSON.parse(context.fileContents) : context.fileContents;
                    inputText += `\n\nFile contents:\n${JSON.stringify(files, null, 2)}`;
                }
                catch {
                    // Ignore parsing errors
                }
            }
            if (context?.featureMap) {
                try {
                    const featureMap = typeof context.featureMap === 'string' ? JSON.parse(context.featureMap) : context.featureMap;
                    inputText += `\n\nFeature map:\n${JSON.stringify(featureMap, null, 2)}`;
                }
                catch {
                    // Ignore parsing errors
                }
            }
        }
        else {
            inputText = typeof input === 'string' ? input : JSON.stringify(input);
        }
        // Prepare initial message with prompt + input
        let conversationHistory = [
            {
                role: 'user',
                parts: [{ text: promptTemplate + '\n\n' + inputText }],
            },
        ];
        // Agentic loop
        const maxIterations = 10;
        let iteration = 0;
        let continueLoop = true;
        let finalResponse = null;
        while (continueLoop && iteration < maxIterations) {
            iteration++;
            console.log(`Gemini iteration ${iteration}`);
            // Determine which functions to provide based on prompt type
            let functionsToUse = [];
            if (promptType === 1) {
                functionsToUse = functionDeclaration.filter((f) => f.name === 'add_feature' || f.name === 'update_feature');
            }
            else if (promptType === 3) {
                functionsToUse = functionDeclaration.filter((f) => f.name === 'get_file');
            }
            else if (promptType === 4) {
                functionsToUse = functionDeclaration.filter((f) => f.name === 'get_file' || f.name === 'update_file');
            }
            else {
                functionsToUse = [];
            }
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: conversationHistory,
                config: functionsToUse.length > 0
                    ? {
                        tools: [
                            {
                                functionDeclarations: functionsToUse,
                            },
                        ],
                    }
                    : undefined,
            });
            const candidate = response.candidates?.[0];
            if (!candidate) {
                finalResponse = 'No response from Gemini';
                break;
            }
            // Check for function calls
            const functionCalls = candidate.content?.parts?.filter((part) => part.functionCall) || [];
            if (functionCalls.length > 0) {
                // Execute all function calls
                const functionResponses = [];
                for (const part of functionCalls) {
                    const functionCall = part.functionCall;
                    if (functionCall) {
                        const result = await executeFunctionCall(functionCall, octokit);
                        functionResponses.push({
                            functionResponse: {
                                name: functionCall.name,
                                response: result,
                            },
                        });
                    }
                }
                // Add function responses to conversation
                conversationHistory.push({
                    role: 'function',
                    parts: functionResponses,
                });
            }
            else {
                // No more function calls - extract final response
                const textPart = candidate.content?.parts?.find((part) => part.text);
                if (textPart) {
                    finalResponse = textPart.text;
                }
                continueLoop = false;
            }
        }
        // Format response based on prompt type (same as original)
        if (promptType === 1) {
            const features = [];
            for (const msg of conversationHistory) {
                if (msg.role === 'function') {
                    for (const part of msg.parts) {
                        if (part.functionResponse) {
                            const response = part.functionResponse.response;
                            if (response.action === 'add' && response.feature) {
                                features.push(response.feature);
                            }
                            else if (response.action === 'update' && response.feature) {
                                features.push(response.feature);
                            }
                        }
                    }
                }
            }
            if (features.length > 0) {
                return res.json({ features });
            }
            else {
                try {
                    const parsed = JSON.parse(finalResponse || '{}');
                    return res.json(parsed);
                }
                catch {
                    return res.json({ features: [] });
                }
            }
        }
        else if (promptType === 2) {
            try {
                const parsed = JSON.parse(finalResponse || '{}');
                return res.json(parsed);
            }
            catch {
                return res.json({
                    features: [],
                    relationships: [],
                });
            }
        }
        else if (promptType === 3) {
            const requestedFiles = [];
            for (const msg of conversationHistory) {
                if (msg.role === 'function') {
                    for (const part of msg.parts) {
                        if (part.functionResponse?.name === 'get_file') {
                            const response = part.functionResponse.response;
                            if (response?.path && !response.error) {
                                requestedFiles.push(response.path);
                            }
                        }
                    }
                }
            }
            try {
                const parsed = JSON.parse(finalResponse || '{}');
                if (parsed.requestedFiles) {
                    requestedFiles.push(...parsed.requestedFiles);
                }
            }
            catch {
                // Not JSON, continue
            }
            return res.json({
                requestedFiles: [...new Set(requestedFiles)],
            });
        }
        else if (promptType === 4) {
            const commits = [];
            for (const msg of conversationHistory) {
                if (msg.role === 'function') {
                    for (const part of msg.parts) {
                        if (part.functionResponse?.name === 'update_file') {
                            const response = part.functionResponse.response;
                            if (response?.commit) {
                                commits.push(response.commit);
                            }
                        }
                    }
                }
            }
            return res.json({
                message: finalResponse || 'Code changes applied',
                commits: commits,
            });
        }
        return res.json({ result: finalResponse || 'Workflow completed' });
    }
    catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate content' });
    }
});
export default router;
