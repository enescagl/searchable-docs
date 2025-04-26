interface Chunk {
  text: string;
  heading: string;
  sectionId: number;
  globalParagraphIndex: number;
}

interface HybridChunkingOptions {
  maxChunkTokens?: number;
  headingRegex?: RegExp;
  paragraphSplitRegex?: RegExp;
  sentenceSplitRegex?: RegExp;
}

function hybridChunking(
  text: string,
  options: HybridChunkingOptions = {}
): Chunk[] {
  const defaultOptions: Required<HybridChunkingOptions> = {
    maxChunkTokens: 500,
    headingRegex: /^#+\s+.+/m,
    paragraphSplitRegex: /\n\n+/,
    sentenceSplitRegex: /(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|!)\s+/,
  };

  const opts: Required<HybridChunkingOptions> = {
    ...defaultOptions,
    ...options,
  };

  const chunks: Chunk[] = [];
  let currentHeading = "Document Start";
  let sectionId = 0;
  let globalParagraphIndex = 0;

  const initialBlocks = text.split(opts.paragraphSplitRegex);

  for (const block of initialBlocks) {
    if (!block.trim()) {
      continue;
    }

    const firstLine = block.split("\n")[0];
    if (opts.headingRegex.test(firstLine)) {
      currentHeading = firstLine.trim().replace(/^#+\s*/, "");
      sectionId++;
    } else {
      const blockTokens = block.split(/\s+/).filter(Boolean).length;

      if (blockTokens > opts.maxChunkTokens) {
        const sentences = block.split(opts.sentenceSplitRegex);
        let currentChunkText = "";
        let currentChunkTokens = 0;

        for (const sentence of sentences) {
          const sentenceTokens = sentence.split(/\s+/).filter(Boolean).length;

          if (
            currentChunkTokens + sentenceTokens > opts.maxChunkTokens &&
            currentChunkText.length > 0
          ) {
            chunks.push({
              text: currentChunkText.trim(),
              heading: currentHeading,
              sectionId: sectionId,
              globalParagraphIndex: globalParagraphIndex,
            });
            currentChunkText = "";
            currentChunkTokens = 0;
          }

          if (sentence.trim().length > 0) {
            currentChunkText +=
              (currentChunkText.length > 0 ? " " : "") + sentence.trim();
            currentChunkTokens += sentenceTokens;
          }
        }

        if (currentChunkText.length > 0) {
          chunks.push({
            text: currentChunkText.trim(),
            heading: currentHeading,
            sectionId: sectionId,
            globalParagraphIndex: globalParagraphIndex,
          });
        }
      } else {
        chunks.push({
          text: block.trim(),
          heading: currentHeading,
          sectionId: sectionId,
          globalParagraphIndex: globalParagraphIndex,
        });
      }
      globalParagraphIndex++;
    }
  }

  return chunks.filter((chunk) => chunk.text.length > 0);
}

export { hybridChunking };
export type { Chunk, HybridChunkingOptions };
