import { Queue, Worker } from "bullmq";
import { getRepoFilesContents } from "~/server/services/github/repo";
import {
  saveDocument,
  getRepositoryBySlug,
  updateProcessedRepository,
} from "~/server/db/repository";
import { REPO_QUEUE_NAME } from "../names";
import { redisConnection } from "../../redis";
import type { ProcessRepositoryJobData } from "./types";
import { consola } from "consola";

export default function initializeRepositoryQueue() {
  const repoProcessingQueue = new Queue<ProcessRepositoryJobData>(
    REPO_QUEUE_NAME,
    {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    },
  );

  const repoWorker = new Worker<ProcessRepositoryJobData>(
    REPO_QUEUE_NAME,
    async (job) => {
      const { owner, repo } = job.data;

      try {
        const repository = await getRepositoryBySlug(`${owner}/${repo}`);

        if (!repository) {
          throw new Error(`Repository not found: ${owner}/${repo}`);
        }

        const files = await getRepoFilesContents(owner, repo);

        if (!files || Object.keys(files).length === 0) {
          throw new Error(`No files found in repository ${owner}/${repo}`);
        }

        consola.info(files);

        const documentsToProcess = files.map(
          ({ key: filePath, value: fileContent }) => ({
            filePath,
            content:
              typeof fileContent === "string"
                ? fileContent
                : JSON.stringify(fileContent),
            repositoryId: repository.id,
          }),
        );

        for (const doc of documentsToProcess) {
          await saveDocument(doc.filePath, repository.id);
        }

        await updateProcessedRepository({
          id: repository.id,
          isProcessed: true,
        });

        return {
          success: true,
          fileCount: documentsToProcess.length,
          documentsToProcess,
        };
      } catch (error) {
        consola.error(
          `❌ Error processing repository ${owner}/${repo}:`,
          error,
        );
        throw error;
      }
    },
    { connection: redisConnection },
  );

  repoWorker.on("completed", (job) => {
    consola.info(`✅ Repository job ${job.id} completed successfully`);
  });

  repoWorker.on("failed", (job, error) => {
    consola.error(
      `❌ Repository job ${job?.id} failed with error: ${error.message}`,
    );
  });

  return { repoProcessingQueue, repoWorker };
}
