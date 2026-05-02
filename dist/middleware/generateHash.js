"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHashPreHandler = generateHashPreHandler;
const hash_utils_1 = require("../utils/hash.utils");
async function generateHashPreHandler(request, reply) {
    const body = request.body;
    if (!body?.chat) {
        return reply.status(400).send({ error: "Chat content missing" });
    }
    const fileHash = (0, hash_utils_1.generateHash)(body.chat);
    // attach to request for next handlers
    request.fileHash = fileHash;
}
