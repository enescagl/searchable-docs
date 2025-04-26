import { getRepositoryBySlug } from "~/server/db/repository";

export default defineEventHandler(async (event) => {
  const { repoSlug } = getRouterParams(event);
  const repo = await getRepositoryBySlug(repoSlug);

  if (!repo) {
    throw createError({
      statusCode: 404,
      statusMessage: "Repository not found",
    });
  }

  return repo;
});
