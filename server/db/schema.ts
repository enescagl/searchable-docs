import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { float32Array } from "./data-types";

export const repositories = sqliteTable(
  "repositories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    owner: text("owner").notNull(),
    repo: text("repo").notNull(),
    ref: text("ref"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    isProcessed: integer("is_processed", { mode: "boolean" }).default(false),
    processedAt: text("processed_at"),
  },
  (table) => [unique("owner_repo_unique").on(table.owner, table.repo)],
);

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filePath: text("file_path").notNull(),
  repositoryId: integer("repository_id")
    .notNull()
    .references(() => repositories.id),
  processedAt: text("processed_at"),
  isProcessed: integer("is_processed", { mode: "boolean" }).default(false),
});

export const embeddings = sqliteTable("embeddings", {
  id: text("id").primaryKey(),
  heading: text("heading").notNull(),
  text: text("text").notNull(),
  embedding: float32Array("embedding", { dimensions: 768 }).notNull(),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
