import { z } from "zod";

export const AddRepoBodySchema = z.object({
  url: z.string().url(),
});
