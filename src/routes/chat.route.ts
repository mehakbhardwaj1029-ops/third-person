import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/authMiddleware';
import { getAllChatsController } from '../controller/chat.controller';

export default function chatRoutes(app: FastifyInstance){

    app.get("/history",{
        preHandler: authMiddleware,
        handler: getAllChatsController,
    })
}