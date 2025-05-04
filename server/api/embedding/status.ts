import ollama from "~/server/services/ollama";

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event);
  let isModelReady = false;

  const interval = setInterval(async () => {
    try {
      // If model is already confirmed ready, we don't need to keep checking
      if (isModelReady) {
        clearInterval(interval);
        return;
      }

      const status = await ollama.list();

      if (
        status.models.find((model) => model.name === "mxbai-embed-large:latest")
      ) {
        isModelReady = true;
        await eventStream.push(JSON.stringify({ data: { isReady: true } }));
        // Once we've confirmed the model is ready, we can stop polling
        clearInterval(interval);
      } else {
        await eventStream.push(JSON.stringify({ data: { isReady: false } }));
      }
    } catch (error) {
      console.error("Error checking Ollama model status:", error);
      // Don't spam logs with errors, wait longer after an error
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }, 3000); // Reduced polling frequency from 1s to 3s

  eventStream.onClosed(async () => {
    clearInterval(interval);
    await eventStream.close();
  });

  return eventStream.send();
});
