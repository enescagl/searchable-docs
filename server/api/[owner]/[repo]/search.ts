import { searchEmbeddings, getRepositoryBySlug } from "~/server/db/repository";

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event, { decode: true });
  const owner = params?.owner;
  const repo = params?.repo;
  const { s } = await getQuery(event);

  if (!s) {
    return [];
  }

  const _repo = await getRepositoryBySlug(`${owner}/${repo}`);

  if (!_repo) {
    throw createError({
      statusCode: 404,
      statusMessage: "Repository not found",
    });
  }

  return await searchEmbeddings(_repo.id, s as string);
});
