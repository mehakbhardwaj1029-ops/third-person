"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileController = void 0;
require("../types/fastify.d");
const fileChat_service_1 = require("../services/fileChat.service");
function getFieldValue(field) {
    if (!field)
        return undefined;
    if (Array.isArray(field)) {
        return field[0]?.value;
    }
    if ("value" in field) {
        return field.value;
    }
    return undefined;
}
//data pipeline
const uploadFileController = async (request, reply) => {
    try {
        const userId = request.user?.id;
        if (!userId) {
            return reply.status(401).send({
                message: "Unauthorized",
            });
        }
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({
                message: "No file uploaded",
            });
        }
        const sourceApp = getFieldValue(data.fields.sourceApp) || "WHATSAPP";
        const tone = getFieldValue(data.fields.tone) || "COACH";
        const fileUrl = getFieldValue(data.fields.fileUrl);
        const filename = data.filename || "unknown.txt";
        const buffer = await data.toBuffer();
        const chat = await (0, fileChat_service_1.uploadChatService)({
            userId,
            fileUrl,
            filename,
            fileBuffer: buffer,
            sourceApp,
            tone,
        });
        return reply.status(201).send({
            id: chat.id,
            messageCount: chat.messageCount,
            participants: chat.participants,
            status: chat.status,
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return reply.status(400).send({
                message: "Valiation failed",
                errors: error.errors,
            });
        }
        if (error.message === "Not allowed") {
            return reply.status(409).send({
                message: "User already exist",
                errors: error.errors,
            });
        }
        return reply.status(500).send({
            message: "Internal Server Error",
        });
    }
};
exports.uploadFileController = uploadFileController;
