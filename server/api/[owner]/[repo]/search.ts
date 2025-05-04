import { searchEmbeddings, getRepositoryBySlug } from "~/server/db/repository";
import { GetRepoQuerySchema } from "~/shared/validations/get-repo";
import { SearchParamSchema } from "~/shared/validations/search-param";

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

  const {
    data: query,
    success: querySuccess,
    error: queryError,
  } = await getValidatedQuery(event, SearchParamSchema.safeParse);

  if (!querySuccess) {
    throw createError({
      statusCode: 400,
      statusMessage: queryError.message,
    });
  }

  const _repo = await getRepositoryBySlug(`${owner}/${repo}`);

  if (!_repo) {
    throw createError({
      statusCode: 404,
      statusMessage: "Repository not found",
    });
  }

  if (!query.s) {
    return [];
  }

  return await searchEmbeddings(_repo.id, query.s);
});
