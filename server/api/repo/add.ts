import { addRepository, getRepositoryBySlug } from "~/server/db/repository";
import { queueRepositoryProcessingJob } from "~/server/services/job/repositories";
import { AddRepoBodySchema } from "~/shared/validations/add-repo";

export default defineEventHandler(async (event) => {
  const { data, success, error } = await readValidatedBody(
    event,
    AddRepoBodySchema.safeParse,
  );

  if (!success) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message,
    });
  }

  const { url } = data;

  const repoInfo = url.split("github.com/")[1].split("/");
  const [owner, repo, ..._] = repoInfo;

  let message = "";

  const repository = await getRepositoryBySlug(`${owner}/${repo}`);

  if (repository) {
    message = `Repository ${owner}/${repo} already exists. starting processing...`;
  } else {
    await addRepository({ owner, repo });
    message = `Repository ${owner}/${repo} added and queued for processing`;
  }

  const jobId = await queueRepositoryProcessingJob(owner, repo);

  return {
    success: true,
    message,
    jobId,
  };
});
