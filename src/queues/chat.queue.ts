import { Queue } from "bullmq";

export const chatQueue = new Queue("chat-processing", {
  connection: {
    host: "127.0.0.1",
    port: 6379,
  },
});


