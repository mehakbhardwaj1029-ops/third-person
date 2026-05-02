"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatQueue = void 0;
const bullmq_1 = require("bullmq");
exports.chatQueue = new bullmq_1.Queue("chat-processing", {
    connection: {
        host: "127.0.0.1",
        port: 6379,
    },
});
