import { repoProcessingQueue } from "./queue";

/**
 * Get stats about the repository queue
 */
export const getRepoQueueStats = async () => {
  return {
    waiting: await repoProcessingQueue.getWaitingCount(),
    active: await repoProcessingQueue.getActiveCount(),
    completed: await repoProcessingQueue.getCompletedCount(),
    failed: await repoProcessingQueue.getFailedCount(),
  };
};
