import { getRepositoryBySlug } from "~/server/db/repository";
import { GetRepoQuerySchema } from "~/shared/validations/get-repo";
import initializeRepositoryQueue from "~/server/services/job/repositories/queue";
import initializeDocumentQueue from "~/server/services/job/documents/queue";
import type { Job } from "bullmq";

const { repoProcessingQueue } = initializeRepositoryQueue();
const { documentProcessingQueue } = initializeDocumentQueue();

export default defineEventHandler(async (event) => {
  const {
    data: params,
    success: paramsSuccess,
    error: paramsError,
  } = await getValidatedRouterParams(event, GetRepoQuerySchema.safeParse, {
    decode: true,
  });

  if (!paramsSuccess) {
    throw createError({
      statusCode: 400,
      statusMessage: paramsError.message,
    });
  }

  const { owner, repo } = params;
  const slug = `${owner}/${repo}`;

  const repository = await getRepositoryBySlug(slug);

  if (!repository) {
    throw createError({
      statusCode: 404,
      statusMessage: "Repository not found",
    });
  }

  // Get repository queue status
  const repoStats = await repoProcessingQueue.getJobCounts(
    "active",
    "waiting",
    "completed",
    "failed",
  );

  // Get repository-specific jobs
  const repoActiveJobs = await repoProcessingQueue.getJobs(
    ["active", "waiting"],
    0,
    100,
  );
  const repoCompletedJobs = await repoProcessingQueue.getJobs(
    ["completed"],
    0,
    10,
  );
  const repoFailedJobs = await repoProcessingQueue.getJobs(["failed"], 0, 10);

  // Filter jobs related to this repository
  const filterRepoJobs = (jobs: Job[]) =>
    jobs.filter((job) => job.data.owner === owner && job.data.repo === repo);

  const repoSpecificActiveJobs = filterRepoJobs(repoActiveJobs);
  const repoSpecificCompletedJobs = filterRepoJobs(repoCompletedJobs);
  const repoSpecificFailedJobs = filterRepoJobs(repoFailedJobs);

  // Get document queue status for this repository
  const docStats = await documentProcessingQueue.getJobCounts(
    "active",
    "waiting",
    "completed",
    "failed",
  );

  const docActiveJobs = await documentProcessingQueue.getJobs(
    ["active", "waiting"],
    0,
    100,
  );
  const docCompletedJobs = await documentProcessingQueue.getJobs(
    ["completed"],
    0,
    10,
  );
  const docFailedJobs = await documentProcessingQueue.getJobs(
    ["failed"],
    0,
    10,
  );

  // Filter document jobs related to this repository
  const filterDocJobs = (jobs: Job[]) =>
    jobs.filter((job) => job.data.repositoryId === repository.id);

  const repoDocumentActiveJobs = filterDocJobs(docActiveJobs);
  const repoDocumentCompletedJobs = filterDocJobs(docCompletedJobs);
  const repoDocumentFailedJobs = filterDocJobs(docFailedJobs);

  // Helper function to format job data
  const formatJob = (job: Job) => ({
    id: job.id,
    state: job.getState(),
    data: job.data,
    timestamp: job.timestamp,
  });

  return {
    repository: {
      id: repository.id,
      owner,
      repo,
      isProcessed: repository.isProcessed,
      processedAt: repository.processedAt,
    },
    queueStatus: {
      repositoryQueue: {
        counts: repoStats,
        activeJobs: repoSpecificActiveJobs.map(formatJob),
        completedJobs: repoSpecificCompletedJobs.map(formatJob),
        failedJobs: repoSpecificFailedJobs.map(formatJob),
      },
      documentQueue: {
        counts: docStats,
        activeJobs: repoDocumentActiveJobs.map(formatJob),
        completedJobs: repoDocumentCompletedJobs.map(formatJob),
        failedJobs: repoDocumentFailedJobs.map(formatJob),
      },
    },
    timestamp: new Date().toISOString(),
  };
});
