import { Octokit } from "@octokit/rest";

interface WriteFileOptions {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
  token: string; // OAuth token or PAT
}

/**
 * Creates or updates a file in a GitHub repo using Octokit.
 */
export async function writeFileToRepo(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch = "main",
  token: string): Promise<void> {
  // OAuth2 tokens MUST use "Bearer", PAT tokens can use "token"
  const octokit = new Octokit({
    auth: token,
  });

  let sha: string | undefined;

  // Step 1: Check whether file exists
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
        ref: branch,
      }
    );

    // File exists → store SHA for update
    if (data && !Array.isArray(data)) {
      sha = data.sha;
    //   console.log(`📝 File exists. Updating (SHA: ${sha.substring(0, 7)})`);
    }
  } catch (err: any) {
    if (err.status === 404) {
    //   console.log("✨ File does not exist. Creating new one...");
    } else {
      throw new Error(`Failed checking file existence: ${err.message}`);
    }
  }

  // Step 2: Create or update file
  try {
    const base64Content = Buffer.from(content).toString("base64");

    const res = await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
        message,
        content: base64Content,
        branch,
        sha, // include only if updating
      }
    );

    // console.log(`✅ File ${path} written to ${branch}`);
    // console.log(`📦 Commit: ${res.data.commit.html_url}`);
  } catch (err: any) {
    throw new Error(`Failed writing file: ${err.message}`);
  }
}