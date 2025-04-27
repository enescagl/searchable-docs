import { getGithubStorage } from "./storage";

const FILE_TYPES = [".md", ".mdx", ".txt", ".rst", ".ipynb"];

export const getRepoDocFileNames = async (owner: string, repo: string) => {
  const storage = await getGithubStorage(owner, repo);
  const keys = await storage.getKeys();

  return keys.filter((key) => FILE_TYPES.some((type) => key.endsWith(type)));
};

export const getRepoFilesContents = async (owner: string, repo: string) => {
  const storage = await getGithubStorage(owner, repo);
  const keys = await storage.getKeys();

  const files = await storage.getItems(
    keys.filter((key) => FILE_TYPES.some((type) => key.endsWith(type))),
  );

  return files;
};
