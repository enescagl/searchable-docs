import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { consola } from "consola";
import { sql } from "drizzle-orm";

// Create a LibSQL client with a local file
const client = createClient({
  url: "file:local.db",
});

// Create a Drizzle ORM instance (we don't need schema here)
const db = drizzle(client);

const createVectorIndex = async () => {
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS vector_index
    ON embeddings(embedding)
    USING vector_cosine(3)
  `);
};

// This function applies all migrations from the drizzle folder
async function main(): Promise<void> {
  try {
    consola.info("⏳ Running migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    consola.success("✅ Migrations completed successfully");
    await createVectorIndex();
    consola.success("✅ Vector index created successfully");
    process.exit(0);
  } catch (error) {
    consola.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
