import { z } from "zod";

export const SearchParamSchema = z.object({
  s: z.string().optional(),
});
