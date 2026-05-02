import {FastifyRequest, FastifyReply} from 'fastify';
import '../types/fastify.d';
import { uploadChatService } from '../services/fileChat.service';
import { Prisma } from '@prisma/client';

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
//data pipeline
export const uploadFileController = async(
    request: FastifyRequest,
    reply: FastifyReply
)=>{
    try{
        const userId = (request.user as { id: string } | undefined)?.id;

        if (!userId) {
            return reply.status(401).send({
                message: "Unauthorized",
            });
        }

        const data = await request.file();


        if(!data){
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


        const buffer = await data.toBuffer();

        const chat = await uploadChatService({
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
        })


    }catch(error: any){

        console.error("UPLOAD ERROR => ", error);
        
    // ZOD VALIDATION ERROR
    if(error.name === "ZodError"){

        return reply.status(400).send({
            message: "Validation failed",
            errors: error.errors,
        });
    }

    // CUSTOM BUSINESS LOGIC ERROR
    if(error.message === "Not allowed"){

        return reply.status(409).send({
            message: "User already exists",
        });
    }

    // PRISMA DATABASE ERRORS
    if(error instanceof Prisma.PrismaClientKnownRequestError){

        // UNIQUE CONSTRAINT
        if(error.code === "P2002"){

            return reply.status(409).send({
                message: "Duplicate field value",
                meta: error.meta,
            });
        }

        // RECORD NOT FOUND
        if(error.code === "P2025"){

            return reply.status(404).send({
                message: "Record not found",
            });
        }

        // FOREIGN KEY CONSTRAINT
        if(error.code === "P2003"){

            return reply.status(400).send({
                message: "Invalid foreign key reference",
            });
        }

        return reply.status(400).send({
            message: "Database operation failed",
            code: error.code,
        });
    }

    // DATABASE CONNECTION ERRORS
    if(error instanceof Prisma.PrismaClientInitializationError){

        return reply.status(500).send({
            message: "Database connection failed",
        });
    }

    // QUERY ENGINE ERRORS
    if(error instanceof Prisma.PrismaClientRustPanicError){

        return reply.status(500).send({
            message: "Database engine crashed",
        });
    }

    // UNKNOWN ERROR
    return reply.status(500).send({
        message: "Internal server error",
    });
}
}