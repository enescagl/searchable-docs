import { queueRepositoryProcessingJob } from "~/server/services/job/repositories";
import { StartRepoProcessingQuerySchema } from "~/shared/validations/start-repo-processing";

export default defineEventHandler(async (event) => {
  const { data, success, error } = await readValidatedBody(
    event,
    StartRepoProcessingQuerySchema.safeParse,
  );

  if (!success) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }

  const { owner, repo } = data;

  await queueRepositoryProcessingJob(owner, repo);

  return {
    success: true,
    message: `Repository ${owner}/${repo} added and queued for processing`,
  };
});
