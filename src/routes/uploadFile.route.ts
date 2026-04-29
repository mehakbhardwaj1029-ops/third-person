import { FastifyInstance } from "fastify";
import { uploadFileController } from "../controller/uploadFile.controller";
import { authMiddleware } from "../middleware/authMiddleware";
import { analyzeChatController, getChatAnalysisController } from "../controller/analyzeChatController";

export async function uploadFileRoutes(app: FastifyInstance ){

    // Upload new chat
    app.post('/upload',{
        preHandler: authMiddleware,
        handler: uploadFileController
    });

    // Trigger analysis for a chat
    app.post('/:chatId/analyze',{
        preHandler: authMiddleware,
        handler: analyzeChatController
    });

    // Get analysis results
    app.get('/analyses/:chatId',{
        preHandler: authMiddleware,
        handler: getChatAnalysisController
    });
}
   