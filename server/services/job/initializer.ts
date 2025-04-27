import { queueDocumentProcessingJob } from "./documents";
import type { RepoJobReturnValue } from "./documents/types";
import { repoQueueEvents } from "./repositories/events";
import { consola } from "consola";

const initializeRepoEvents = () => {
  repoQueueEvents.on("completed", async ({ jobId, returnvalue }) => {
    const parsedValue: RepoJobReturnValue =
      typeof returnvalue === "string" ? JSON.parse(returnvalue) : returnvalue;

    if (parsedValue && parsedValue.documentsToProcess) {
      const { documentsToProcess } = parsedValue;

      for (const doc of documentsToProcess) {
        await queueDocumentProcessingJob(
          doc.filePath,
          doc.content,
          doc.repositoryId,
        );
      }

      consola.info(
        `📄⤵ Queued ${documentsToProcess.length} documents for processing from repo job ${jobId}`,
      );
    }
  });
};

export const initializeEvents = () => {
  consola.info("🔄 Initializing events");
  initializeRepoEvents();
};
