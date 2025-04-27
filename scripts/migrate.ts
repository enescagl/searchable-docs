import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { consola } from "consola";
import { sql } from "drizzle-orm";

const client = createClient({
  url: process.env.DATABASE_URL || "http://localhost:8089",
});

const db = drizzle(client);

const createVectorIndex = async () => {
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS vector_index
    ON embeddings (libsql_vector_idx(embedding));
  `);
};

// This function applies all migrations from the drizzle folder
async function main(): Promise<void> {
  try {
    consola.info("⏳ Running migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    consola.success("✅ Migrations completed successfully");

    // Try to create vector index if supported
    try {
      consola.info("⏳ Creating vector index...");
      await createVectorIndex();
      consola.success("✅ Vector index created successfully");
    } catch (indexError) {
      consola.warn(
        "⚠️ Could not create vector index. This may be expected if your libsql build doesn't support vector extensions or if you're not using a Turso database with vector support.",
      );
      consola.debug(indexError);
    }

    process.exit(0);
  } catch (error) {
    consola.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
