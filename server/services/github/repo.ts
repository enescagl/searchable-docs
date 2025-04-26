import fs from "fs";
import path from "path";
import { parseTarGzip } from "nanotar";
import { Octokit } from "octokit";
import { saveDocument } from "~/server/db/repository";
import { consola } from "consola";

const FILE_TYPES = [".md", ".mdx", ".txt", ".rst", ".ipynb"];

export const downloadRepo = async (owner: string, repo: string) => {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const response = await octokit.request("GET /repos/{owner}/{repo}/tarball", {
    owner,
    repo,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  return response.data;
};

export const extractRepo = async (
  owner: string,
  repo: string,
  tarballData: Buffer,
  repositoryId: number,
) => {
  const reposDir = path.join(process.cwd(), "repos");
  if (!fs.existsSync(reposDir)) {
    fs.mkdirSync(reposDir);
  }

  const tar = await parseTarGzip(tarballData);
  const repoDocsDir = path.join(reposDir, `${repo}-docs`);

  if (fs.existsSync(repoDocsDir)) {
    fs.rmSync(repoDocsDir, { recursive: true });
  }
  fs.mkdirSync(repoDocsDir);

  const savedFiles = [];
  for (const file of tar) {
    if (file.type !== "file") {
      console.error(`Skipping because it's not a file: ${file.name}`);
      continue;
    }

    if (!FILE_TYPES.includes(path.extname(file.name))) {
      console.error(
        `Skipping because it's not a valid file type: ${file.name}`,
      );
      continue;
    }

    if (!file.data) {
      console.error(`Skipping file with no data: ${file.name}`);
      continue;
    }

    const parts = file.name.split("/");
    parts.shift();
    const relativePath = parts.join("/");

    if (!relativePath || !path.extname(relativePath)) {
      consola.error(`⏭️ Skipping invalid path: ${relativePath}`);
      continue;
    }

    try {
      const fileDir = path.join(repoDocsDir, path.dirname(relativePath));
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      const filePath = path.join(repoDocsDir, relativePath);
      consola.info(`📄 Writing file to: ${filePath}`);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        consola.warn(`⏭️ Skipping directory path: ${filePath}`);
        continue;
      }

      fs.writeFileSync(filePath, Buffer.from(file.data));

      const dbPath = path.relative(process.cwd(), filePath);
      await saveDocument(dbPath, repositoryId);
      savedFiles.push(dbPath);
    } catch (error) {
      consola.error(`❌ Error processing file ${file.name}:`, error);
      continue;
    }
  }
  return savedFiles;
};
