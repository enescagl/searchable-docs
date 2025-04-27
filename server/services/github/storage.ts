import { Octokit } from "octokit";
import type { Storage, StorageValue } from "unstorage";
import { createStorage } from "unstorage";
import githubDriver from "unstorage/drivers/github";
import { redisConnection } from "~/server/services/redis";

const CACHE_PREFIX = "github_storage:";
const CACHE_TTL = 60 * 60;

export const getGithubStorage = async (
  owner: string,
  repo: string,
): Promise<Storage<StorageValue>> => {
  const cacheKey = `${CACHE_PREFIX}${owner}/${repo}`;

  const cachedData = await redisConnection.get(cacheKey);
  if (cachedData) {
    try {
      const metadata = JSON.parse(cachedData);
      return createStorage({
        driver: githubDriver({
          token: metadata.token,
          repo: metadata.repo,
          branch: metadata.branch,
        }),
      });
    } catch (error) {
      console.error("Error parsing cached GitHub storage data:", error);
    }
  }

  const githubToken = useRuntimeConfig().githubToken;

  const octokit = new Octokit({
    auth: githubToken,
  });

  const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
    owner,
    repo,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const storageMetadata = {
    token: githubToken,
    repo: `${owner}/${repo}`,
    branch: data.default_branch,
  };

  await redisConnection.set(
    cacheKey,
    JSON.stringify(storageMetadata),
    "EX",
    CACHE_TTL,
  );

  return createStorage({
    driver: githubDriver(storageMetadata),
  });
};
