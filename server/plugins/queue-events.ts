import { initializeEvents } from "~/server/services/job/initializer";

export default defineNitroPlugin(() => {
  initializeEvents();
});
