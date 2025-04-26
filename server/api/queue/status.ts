import initializeRepositoryQueue from "~/server/services/job/repositories/queue";
import initializeDocumentQueue from "~/server/services/job/documents/queue";

const { repoProcessingQueue } = initializeRepositoryQueue();
const { documentProcessingQueue } = initializeDocumentQueue();

export default defineEventHandler(async () => {
  const repoStats = await repoProcessingQueue.getJobCounts();
  const docStats = await documentProcessingQueue.getJobCounts();

  return {
    repositories: repoStats,
    documents: docStats,
    timestamp: new Date().toISOString(),
  };
});
