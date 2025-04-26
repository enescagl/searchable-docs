import { searchRepository, getRepositories } from "~/server/db/repository";

export default defineEventHandler(async (event) => {
  const { s } = await getQuery(event);

  if (s === undefined || s === "") {
    const repos = await getRepositories();
    if (repos.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "No repositories found",
      });
    }
    return repos;
  }

  const repo = await searchRepository(s as string);

  if (!repo || repo.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Repository not found",
    });
  }

  return repo;
});
