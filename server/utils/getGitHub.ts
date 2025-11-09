import { Octokit } from "@octokit/rest";

export interface RepoFile {
  path: string;
  content: string;
}

/**
 * Pulls all files (recursively) from a GitHub repo using Octokit.
 * Works with private repos if a token is provided.
 *
 * @param owner GitHub username or org
 * @param repo Repo name
 * @param branch Branch name (default: "main")
 * @param token GitHub personal access token (required for private repos)
 * @returns Array of { path, content }
 */
export async function fetchAllFilesFromRepo({
  owner,
  repo,
  branch = "main",
  token,
}: {
  owner: string;
  repo: string;
  branch?: string;
  token?: string;
}): Promise<string> {
  console.log("Fetching all files from repo:", owner + "/" + repo + "@" + branch);
  console.log("Using token:", token);

  if (!token) {
    throw new Error("A GitHub token is required for private repos");
  }

  const octokit = new Octokit({ auth: token });

  // Step 1: Get the branch's SHA
  const branchInfo = await octokit.repos.getBranch({ owner, repo, branch });
  const commitSha = branchInfo.data.commit.sha;

  // Step 2: Get the full tree recursively
  const treeResponse = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: commitSha,
    recursive: "true",
  });

  const tree = treeResponse.data.tree;

  // Filter blobs (files)
  const files = tree.filter((item) => item.type === "blob");

  // Step 3: Fetch file contents
  const results: RepoFile[] = [];
  for (const file of files) {
    if (!file.sha || !file.path) continue;

    const blob = await octokit.git.getBlob({ owner, repo, file_sha: file.sha });
    // Content comes in base64; decode it
    const content = Buffer.from(blob.data.content, "base64").toString("utf-8");
    results.push({ path: file.path, content });
  }

  let compressedRepo: string = ""
  results.forEach(r => {
    compressedRepo += "## " + r.path + "\n```" + r.content + "```"
  });

  return compressedRepo;
}