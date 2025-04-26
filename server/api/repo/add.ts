import { addRepository, getRepositoryBySlug } from "~/server/db/repository";
import { queueRepositoryProcessingJob } from "~/server/services/job/repositories";

export default defineEventHandler(async (event) => {
  const { url } = await readBody(event);

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
