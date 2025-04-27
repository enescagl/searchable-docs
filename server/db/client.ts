import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Create a LibSQL client with a local file
const client = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
});

// Create a Drizzle ORM instance
export const db = drizzle(client, { schema });
