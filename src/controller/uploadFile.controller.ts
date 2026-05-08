import {FastifyRequest, FastifyReply} from 'fastify';
import { uploadChatService } from '../services/fileChat.service';

function getFieldValue(field: any): string | undefined {
  if (!field) return undefined;

  if (Array.isArray(field)) {
    return field[0]?.value;
  }

  if ("value" in field) {
    return field.value;
  }

  return undefined;
}

export const uploadFileController = async(
    request: FastifyRequest,
    reply: FastifyReply
)=>{
    const log = request.log;

    try{
        log.info("Upload file request received");

        const userId = (request.user as { id: string } | undefined)?.id;

        if (!userId) {
            log.warn("Unauthorized upload attempt");
            return reply.status(401).send({
                message: "Unauthorized",
            });
        }

        const data = await request.file();

        if(!data){
            log.warn({ userId }, "No file uploaded");
            return reply.status(400).send({
                message: "No file uploaded",
            });
        }

        const sourceApp =
         getFieldValue(data.fields.sourceApp) || "WHATSAPP";

        const tone =
        getFieldValue(data.fields.tone) || "COACH";

        const fileUrl =
        getFieldValue(data.fields.fileUrl);

        const filename = data.filename || "unknown.txt";

        log.info({ userId, filename, sourceApp, tone }, "File metadata extracted");

        const buffer = await data.toBuffer();

        log.info({ userId, size: buffer.length }, "File buffer created");

        const result = await uploadChatService({
            userId,
            fileUrl,
            filename,
            fileBuffer: buffer,
            sourceApp,
            tone,
        }, { log }); 

        log.info({ userId, chatId: result.chat.id }, "File uploaded successfully");

        return reply.status(201).send({
        fileHash: result.chat.fileHash,
        messageCount: result.chat.messageCount,
        participants: result.chat.participants,
        status: result.chat.status,

        uploadType: result.uploadType,
    });

    }catch(error: any){

    log.error(error, "Upload failed");

    if(error.name === "ZodError"){

        return reply.status(400).send({
            message: "Validation failed",
            errors: error.errors,
        });
    }

    if(error.message === "CHAT_ALREADY_EXISTS"){
        return reply.status(409).send({
            message: "Chat already analyzed"
        });
    }

    return reply.status(500).send({
        message: "Internal server error",
    });
}
}