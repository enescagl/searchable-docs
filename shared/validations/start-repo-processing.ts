import { z } from "zod";

export const StartRepoProcessingQuerySchema = z.object({
  owner: z.string(),
  repo: z.string(),
});
