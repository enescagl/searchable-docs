import { getRepositories } from "~/server/db/repository";

export default defineEventHandler(async () => {
  const repositories = await getRepositories();
  return repositories;
});
