import { Octokit } from "octokit";
import { createStorage } from "unstorage";
import githubDriver from "unstorage/drivers/github";

const FILE_TYPES = [".md", ".mdx", ".txt", ".rst", ".ipynb"];

export const getRepoDocFileNames = async (owner: string, repo: string) => {
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

  const storage = createStorage({
    driver: githubDriver({
      token: githubToken,
      repo: `${owner}/${repo}`,
      branch: data.default_branch,
    }),
  });

  const keys = await (await storage).getKeys();

  return keys.filter((key) => FILE_TYPES.some((type) => key.endsWith(type)));
};

export const getRepoFilesContents = async (owner: string, repo: string) => {
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

  const storage = createStorage({
    driver: githubDriver({
      token: githubToken,
      repo: `${owner}/${repo}`,
      branch: data.default_branch,
    }),
  });

  const keys = await (await storage).getKeys();

  const files = await (
    await storage
  ).getItems(
    keys.filter((key) => FILE_TYPES.some((type) => key.endsWith(type))),
  );

  return files;
};
