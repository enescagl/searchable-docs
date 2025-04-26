import initializeDocumentQueue from "./queue";

const { documentProcessingQueue } = initializeDocumentQueue();

/**
 * Add a document to the processing queue
 * @param filePath Path to the document file
 * @param content Content of the document
 * @param repositoryId ID of the repository the document belongs to
 * @returns The job ID
 */
export const queueDocumentProcessingJob = async (
  filePath: string,
  content: string,
  repositoryId: number,
) => {
  const job = await documentProcessingQueue.add("process", {
    filePath,
    content,
    repositoryId,
  });
  return job.id;
};
