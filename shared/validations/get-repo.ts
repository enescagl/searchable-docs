import { z } from "zod";

export const GetRepoQuerySchema = z.object({
  owner: z.string(),
  repo: z.string(),
});
