import { Router } from 'express';
import { GoogleGenAI, Type, type FunctionCall } from '@google/genai';
import { Octokit } from '@octokit/rest';
import type { AuthRequest } from '../middleware/auth.js';
import type { Feature } from '../models/Feature.js';
import { authenticateToken } from '../middleware/auth.js';

import { getPrompts } from '../utils/prompts.js'
import { fetchAllFilesFromRepo } from '../utils/getGitHub.js'
import { renderTemplate } from '../utils/fillPrompt.js'
import type { RepoFile } from '../utils/getGitHub.js'

import { writeFileToRepo } from '../utils/updateGithub.js'
import { User } from '../models/User.js';
import { getGithubTokenForUser } from '../services/githubToken.js';

import { createRepoWebhook } from '../utils/createWebhook.js'
const router = Router();
// router.use(authenticateToken);

const ai = new GoogleGenAI({ apiKey: "AIzaSyCFSPOjc6d6av448EEg8MVYBtuZXVOaDWc" })

interface GetFileArgs {
  owner: string;
  repo: string;
  file_path: string;
  branch?: string;
}

interface UpdateFileArgs {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
  sha: string;
}

interface FeatureEntry {
  name?: string;
  user_description?: string;
  technical_description?: string;
  file_references?: string[];
  neighbors: string[];
}

// Gemini API endpoint for creating feature map
router.post("/create-feature-map", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const githubUser = req.body.githubUser;
    const repoName = req.body.repoName;
    if (!githubUser || !repoName) {
      throw new Error("Missing required field: repoName");
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = await getGithubTokenForUser(req.userId);
    if (!token) {
      return res.status(400).json({ error: 'GitHub not connected for this user' });
    }

    // // Create an endpoint to monitor for updates:
    // createRepoWebhook(
    //   token,
    //   githubUser,
    //   repoName
    // )

    //Fetch entire GitHub repository
    const repo: string = await fetchAllFilesFromRepo({ owner: githubUser, repo: repoName, token: token });
    console.log("repo name: " + repo);
    //Get feature generation markdown and functions, inputted with repository code
    const { markdown, json } = await getPrompts("feature");
    const featurePrompt = renderTemplate(markdown, { "repo": repo })

    // Generate feature groups using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: featurePrompt,
      config: {
        tools: [{
          //@ts-ignore
          functionDeclarations: json
        }],
      },
    });
    console.log(response.functionCalls?.length);
    console.log(response.functionCalls);
    
    const featureGroup: Record<string, FeatureEntry> = {};
    if (response.functionCalls && response.functionCalls.length > 0) {
      //Process all returned functions for adding/updating features
      response.functionCalls.forEach((func) => {
        const funcArgs = func.args as Record<string, unknown>
        if (!funcArgs) return;

        const featureName = typeof funcArgs.name === 'string' ? funcArgs.name : undefined;
        const userDescription = typeof funcArgs.user_description === 'string' ? funcArgs.user_description : undefined;
        const technicalDescription = typeof funcArgs.technical_description === 'string' ? funcArgs.technical_description : undefined;
        const fileReferences = Array.isArray(funcArgs.file_references)
          ? (funcArgs.file_references as string[])
          : [];

        if (featureName && userDescription && technicalDescription) {
          featureGroup[featureName] = {
            name: featureName,
            user_description: userDescription,
            technical_description: technicalDescription,
            file_references: fileReferences,
            neighbors: [],
          };
        }
      });
      //Create feature map
      const mapFuncCalls = await makeFeatureMap(JSON.stringify(featureGroup));
      if (mapFuncCalls) {
        mapFuncCalls.forEach((func) => {
          //Append neighbors to existing feature group
          const funcArg = func.args as Record<string, any> | undefined;

          if (
            funcArg &&
            Array.isArray(funcArg.connected_features?.items) &&
            typeof funcArg.name === 'string'
          ) {
            const nodeName = funcArg.name;
            if (featureGroup[nodeName]) {
              // Filter connected feature names as strings
              const connectedNames = funcArg.connected_features.items.filter(
                (name: any) => typeof name === 'string'
              );

              featureGroup[nodeName].neighbors.push(...connectedNames);
            }
          }
          
        });
      }
      // Convert featureGroup object to JSON string
      const featureMapStr = JSON.stringify(featureGroup);
      console.log(featureMapStr);
      await User.findByIdAndUpdate(req.userId, { featureMap: featureMapStr });

      res.json({ success: true, featureMap: featureMapStr });

    } else {
      console.log(response.text)
      res.json({"success": false})
    }
  } catch (error) {
    console.error("Gemini generation error:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});


// Generate feature map from disconnected features with Gemini
async function makeFeatureMap(features: string) : Promise<FunctionCall[] | null> {
  const { markdown, json } = await getPrompts("map");
  const mapPrompt = renderTemplate(markdown, { "features": features })

  // Generate content using Gemini
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: mapPrompt,
    config: {
      tools: [{
        //@ts-ignore
        functionDeclarations: json
      }],
    },
  });
  
  // The response object may vary depending on Gemini client version
  // Typically output text is in response.output_text
  if (response.functionCalls && response.functionCalls.length > 0) {
    return response.functionCalls
  } else {
    console.log(response.text)
    return null;
  }
}

router.post("/generate-feature", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { githubUser, repoName, requestedFeature } = req.body;

    console.log("githubUser:", githubUser);
    console.log("repoName:", repoName);
    console.log("requestedFeature:", requestedFeature);

    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!githubUser || !repoName) {
      return res.status(400).json({ error: 'Missing githubUser or repoName' });
    }

    const githubToken = await getGithubTokenForUser(req.userId);
    console.log("GitHub Token:", githubToken);
    if (!githubToken) {
      return res.status(400).json({ error: 'GitHub not connected for this user' });
    }

    const repo: String = await fetchAllFilesFromRepo({
      owner: githubUser,
      repo: repoName,
      token: githubToken,
    });

    //Get feature generation markdown and functions, inputted with repository code
    const { markdown, json } = await getPrompts("edit");
    const featurePrompt = renderTemplate(markdown, {
      "requestedFeature": requestedFeature,
      "featureFormat": repo,
      "featureMap": repo, // Need to implement
      "sourceCode": repo,
    })
    // Generate feature groups using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: featurePrompt,
      config: {
        tools: [{
          //@ts-ignore
          functionDeclarations: json
        }],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      response.functionCalls.forEach((func) => {
        const funcName = func.name;
        const funcArgs = (func.args as Record<string, unknown>);
        if (!funcArgs) return;
        // Add file to github repository
        if (funcName === "update_file") {
          writeFileToRepo(
            githubUser,
            repoName,
            // @ts-ignore
            funcArgs?.filename,
            funcArgs?.content,
            "VibeEngine updated a file in the repository.",
            "main",
            githubToken
          )
        } else if (funcName == "add_file") {
          writeFileToRepo(
            githubUser,
            repoName,
            // @ts-ignore
            funcArgs?.filename ?? "",
            funcArgs?.content ?? "",
            "VibeEngine added a file to the repository.",
            "main",
            githubToken
          )
        }
      });

      const ret = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: featurePrompt,
      });

      return res.json({
        "return": ret.text
      })
    } else {
      console.log(response.text)
      res.json(null)
    }
  } catch (error) {
    console.error("Gemini generation error:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});




export default router;