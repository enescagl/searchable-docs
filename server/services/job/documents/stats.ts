import { documentProcessingQueue } from "./queue";

/**
 * Get stats about the document queue
 */
export const getDocQueueStats = async () => {
  return {
    waiting: await documentProcessingQueue.getWaitingCount(),
    active: await documentProcessingQueue.getActiveCount(),
    completed: await documentProcessingQueue.getCompletedCount(),
    failed: await documentProcessingQueue.getFailedCount(),
  };
};
