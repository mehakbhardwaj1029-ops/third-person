"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileRoutes = uploadFileRoutes;
const uploadFile_controller_1 = require("../controller/uploadFile.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const analyzeChatController_1 = require("../controller/analyzeChatController");
async function uploadFileRoutes(app) {
    // Upload new chat
    app.post('/upload', {
        preHandler: authMiddleware_1.authMiddleware,
        handler: uploadFile_controller_1.uploadFileController
    });
    // Trigger analysis for a chat
    app.post('/:chatId/analyze', {
        preHandler: authMiddleware_1.authMiddleware,
        handler: analyzeChatController_1.analyzeChatController
    });
    // Get analysis results
    app.get('/analyses/:chatId', {
        preHandler: authMiddleware_1.authMiddleware,
        handler: analyzeChatController_1.getChatAnalysisController
    });
}
