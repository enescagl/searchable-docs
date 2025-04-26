import { QueueEvents } from "bullmq";
import { REPO_QUEUE_NAME } from "../names";
import { redisConnection } from "../../redis";

export const repoQueueEvents = new QueueEvents(REPO_QUEUE_NAME, {
  connection: redisConnection,
});
