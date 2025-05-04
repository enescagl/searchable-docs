import ollama from "~/server/services/ollama";

export interface EmbeddingResponse {
  id: string;
  heading: string;
  text: string;
  embedding: number[][];
}

export async function embedText(text: string) {
  const response = await ollama.embed({
    model: "mxbai-embed-large",
    input: text,
  });
  return response.embeddings;
}
