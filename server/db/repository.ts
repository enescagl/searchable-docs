import { db } from "~/server/db/client";
import { embeddings, documents, repositories } from "~/server/db/schema";
import type {
  Document,
  Repository,
  NewEmbedding,
  NewDocument,
  NewRepository,
} from "~/shared/types";
import { embedText, type EmbeddingResponse } from "~/server/services/embedding";
import { eq, and, like, or } from "drizzle-orm";

export async function saveEmbeddings(
  embeddingsData: EmbeddingResponse[],
  documentId: number,
) {
  const values: NewEmbedding[] = embeddingsData.map((e) => ({
    id: e.id,
    heading: e.heading,
    text: e.text,
    embedding: e.embedding.flat(),
    documentId,
  }));

  for (const value of values) {
    await db.insert(embeddings).values(value).onConflictDoUpdate({
      target: embeddings.id,
      set: value,
    });
  }
}

export async function searchEmbeddings(
  repositoryId: number,
  search: string,
): Promise<EmbeddingResponse[]> {
  const embeddedSearch = await embedText(search);
  const buffer = Buffer.from(Float32Array.from(embeddedSearch.flat()).buffer);

  const result = await db.$client.execute(
    `SELECT id, heading, text, vector_extract(embedding) as embedding_extracted, 
            vector_distance_cos(embedding, vector32(?)) as distance 
     FROM embeddings 
     WHERE document_id IN (
       SELECT id FROM documents WHERE repository_id = ?
     ) 
     ORDER BY distance LIMIT 10`,
    [buffer, repositoryId],
  );

  return result.rows.map((row: unknown) => {
    const typedRow = row as [string, string, string, ArrayBuffer];
    const embedBuffer = typedRow[3];
    const flatArray = Array.from(new Float32Array(embedBuffer as ArrayBuffer));
    const embedding = [flatArray];

    return {
      id: typedRow[0],
      heading: typedRow[1],
      text: typedRow[2],
      embedding,
    };
  });
}

export async function saveDocument(filePath: string, repositoryId: number) {
  const newDocument: NewDocument = {
    filePath,
    repositoryId,
  };

  await db.insert(documents).values(newDocument);
}

export async function getDocument(
  filePath: string,
): Promise<Document | undefined> {
  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.filePath, filePath))
    .limit(1);
  return result[0];
}

export async function getDocuments(): Promise<Document[]> {
  return db.select().from(documents);
}

export async function addRepository(repository: {
  owner: string;
  repo: string;
}): Promise<number> {
  const newRepository: NewRepository = {
    owner: repository.owner,
    repo: repository.repo,
  };

  const result = await db
    .insert(repositories)
    .values(newRepository)
    .returning({ id: repositories.id });
  return result[0].id;
}

export async function updateDocumentProcessed(document: {
  id: number;
  isProcessed: boolean;
}): Promise<number> {
  const result = await db
    .update(documents)
    .set({
      isProcessed: document.isProcessed,
      processedAt: new Date().toISOString(),
    })
    .where(eq(documents.id, document.id))
    .returning({ id: documents.id });
  return result[0].id;
}

export async function updateProcessedRepository(repository: {
  id: number;
  isProcessed: boolean;
}): Promise<number> {
  const result = await db
    .update(repositories)
    .set({
      isProcessed: repository.isProcessed,
      processedAt: new Date().toISOString(),
    })
    .where(eq(repositories.id, repository.id))
    .returning({ id: repositories.id });
  return result[0].id;
}

export async function getRepositories(): Promise<Repository[]> {
  return db.select().from(repositories);
}

export async function getRepositoryBySlug(
  slug: string,
): Promise<Repository | undefined> {
  const [owner, repo] = slug.split("/");

  const result = await db
    .select()
    .from(repositories)
    .where(and(eq(repositories.owner, owner), eq(repositories.repo, repo)))
    .limit(1);

  return result[0];
}

export async function getRepositoryById(
  id: number,
): Promise<Repository | undefined> {
  const result = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, id))
    .limit(1);

  return result[0];
}

export async function searchRepository(text: string): Promise<Repository[]> {
  const result = await db
    .select()
    .from(repositories)
    .where(
      or(
        like(repositories.owner, `%${text}%`),
        like(repositories.repo, `%${text}%`),
      ),
    )
    .limit(5);

  return result;
}
