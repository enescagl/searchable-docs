import { Queue, Worker } from "bullmq";
import {
  getDocument,
  saveEmbeddings,
  updateDocumentProcessed,
} from "~/server/db/repository";
import { createEmbeddings } from "~/server/services/embedding";
import { hybridChunking } from "~/server/services/chunking";
import { DOC_QUEUE_NAME } from "../names";
import { redisConnection } from "../../redis";
import type { ProcessDocumentJobData } from "./types";
import { consola } from "consola";

export default function initializeDocumentQueue() {
  const documentProcessingQueue = new Queue<ProcessDocumentJobData>(
    DOC_QUEUE_NAME,
    {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
      },
    },
  );

  const documentWorker = new Worker<ProcessDocumentJobData>(
    DOC_QUEUE_NAME,
    async (job) => {
      const { filePath, content, repositoryId: _repositoryId } = job.data;

      try {
        const document = await getDocument(filePath);
        if (!document) {
          throw new Error(`Document not found: ${filePath}`);
        }

        if (document.isProcessed) {
          throw new Error(`Document already processed: ${filePath}`);
        }

        const chunks = hybridChunking(content);

        const embeddingChunks = chunks.map((chunk) => ({
          text: chunk.text,
          heading: chunk.heading,
        }));

        const embeddingsData = await createEmbeddings(embeddingChunks);

        await saveEmbeddings(embeddingsData, document.id);
        await updateDocumentProcessed({ id: document.id, isProcessed: true });

        return { success: true, chunkCount: chunks.length };
      } catch (error) {
        consola.error(`❌ Error processing document ${filePath}:`, error);
        throw error;
      }
    },
    { connection: redisConnection },
  );

  // documentWorker.on("completed", (job) => {
  //   consola.info(`✅ Document job ${job.id} completed successfully`);
  // });

  documentWorker.on("failed", (job, error) => {
    consola.error(
      `❌ Document job ${job?.id} failed with error: ${error.message}`,
    );
  });

  return { documentProcessingQueue, documentWorker };
}
