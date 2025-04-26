import { QueueEvents } from "bullmq";
import { redisConnection } from "../../redis";
import { DOC_QUEUE_NAME } from "../names";

// Create a QueueEvents instance for the doc queue
export const docQueueEvents = new QueueEvents(DOC_QUEUE_NAME, {
  connection: redisConnection,
});
