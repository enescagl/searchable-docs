import consola from "consola";
import ollama from "~/server/services/ollama";

export default defineNitroPlugin(async () => {
  consola.info("Initializing ollama model");
  await ollama.pull({
    model: "mxbai-embed-large",
  });
  consola.success("Ollama model initialized");
});
