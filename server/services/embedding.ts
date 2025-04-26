import ollama from "~/server/services/ollama";

export interface EmbeddingResponse {
  id: string;
  heading: string;
  text: string;
  embedding: number[][];
}

export async function embedText(text: string) {
  const response = await ollama.embed({
    model: "nomic-embed-text",
    input: text,
  });
  return response.embeddings;
}

export async function createEmbeddings(
  chunks: { text: string; heading: string }[],
) {
  return Promise.all(
    chunks.map(async ({ text, heading }, i) => ({
      id: `chunk_${i}`,
      heading,
      text,
      embedding: await embedText(text),
    })),
  );
}
