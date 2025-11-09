import { User } from '../models/User.js';

/**
 * Returns the GitHub access token for a given userId, or null if not found / not connected.
 */
export async function getGithubTokenForUser(userId: string): Promise<string | null> {
  const user = await User.findById(userId).select('githubToken');

  if (!user || !user.githubToken) {
    return null;
  }

  return user.githubToken;
}