import {
  blob,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
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

export const documents = sqliteTable(
  "documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    filePath: text("file_path").notNull(),
    repositoryId: integer("repository_id")
      .notNull()
      .references(() => repositories.id),
    processedAt: text("processed_at"),
    isProcessed: integer("is_processed", { mode: "boolean" }).default(false),
  },
  (table) => [
    unique("repo_file_path_unique").on(table.repositoryId, table.filePath),
  ],
);

export const embeddings = sqliteTable("embeddings", {
  id: text("id").primaryKey(),
  heading: text("heading").notNull(),
  text: text("text").notNull(),
  embedding: float32Array("embedding", { dimensions: 1024 }).notNull(),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  totpKey: blob("totp_key"),
  recoveryCodes: blob("recovery_codes"),
});

export const emailVerificationRequest = sqliteTable(
  "email_verification_requests",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    email: text("email").notNull(),
    code: text("code").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
);

export const passwordResetSession = sqliteTable("password_reset_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  twoFactorVerified: integer("two_factor_verified", {
    mode: "boolean",
  }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
