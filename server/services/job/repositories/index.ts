import initializeRepositoryQueue from "./queue";

const { repoProcessingQueue } = initializeRepositoryQueue();

/**
 * Add a repository to the processing queue
 * @param owner GitHub repository owner
 * @param repo GitHub repository name
 * @returns The job ID
 */
export const queueRepositoryProcessingJob = async (
  owner: string,
  repo: string,
) => {
  const job = await repoProcessingQueue.add("process", { owner, repo });
  return job.id;
};
