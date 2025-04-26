import { AutoTokenizer, type BertTokenizer } from "@huggingface/transformers";
import { consola } from "consola";

export const MAX_TOKENS = 500;
export const OVERLAP = 50;

export interface Chunk {
  text: string;
  heading: string;
}

let tokenizer: BertTokenizer | undefined;

export async function loadTokenizer() {
  try {
    tokenizer = await AutoTokenizer.from_pretrained("bert-base-cased");
    consola.success("✅ Tokenizer loaded successfully.");
    return tokenizer;
  } catch (error) {
    consola.error("❌ Failed to load tokenizer:", error);
    process.exit(1);
  }
}

export function countTokens(text: string): number {
  if (!tokenizer) {
    throw new Error("Tokenizer not loaded. Call loadTokenizer() first.");
  }

  const tokens = tokenizer.tokenize(text);
  return tokens.length;
}

export function splitLongText(text: string): string[] {
  if (!tokenizer) {
    throw new Error("Tokenizer not loaded. Call loadTokenizer() first.");
  }

  const tokens = tokenizer.encode(text);

  const chunks: string[] = [];

  for (let i = 0; i < tokens.length; i += MAX_TOKENS - OVERLAP) {
    const slice = tokens.slice(i, i + MAX_TOKENS);
    const decoded = tokenizer.batch_decode([slice]);
    chunks.push(decoded[0].trim());
  }

  return chunks;
}

export function createTokenizedChunks(chunks: Chunk[]): Chunk[] {
  const finalChunks: Chunk[] = [];

  for (const chunk of chunks) {
    if (countTokens(chunk.text) > MAX_TOKENS) {
      const subChunks = splitLongText(chunk.text);
      subChunks.forEach((subChunk, idx) => {
        finalChunks.push({
          text: subChunk,
          heading: `${chunk.heading} (part ${idx + 1})`,
        });
      });
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks;
}

export function getTokenizer(): AutoTokenizer | undefined {
  return tokenizer;
}
