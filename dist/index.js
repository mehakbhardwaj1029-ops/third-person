"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const user_route_1 = require("./routes/user.route");
const multipart_1 = __importDefault(require("@fastify/multipart"));
const uploadFile_route_1 = require("./routes/uploadFile.route");
const app = (0, fastify_1.default)({ logger: true });
app.register(cors_1.default, {
    origin: "http://localhost:5173",
});
app.register(cookie_1.default);
app.register(helmet_1.default);
app.register(jwt_1.default, {
    secret: process.env.JWT_SECRET || "supersecretkey",
});
app.register(multipart_1.default, {
    limits: {
        fileSize: 50 * 1024 * 1024 // 50 MB
    }
});
app.get("/health", async () => {
    return { status: "OK" };
});
app.register(user_route_1.userRoutes, { prefix: '/api/users' });
app.register(uploadFile_route_1.uploadFileRoutes, { prefix: '/api/chats' });
// graceful shutdown
const listeners = ['SIGINT', 'SIGTERM'];
listeners.forEach((signal) => {
    process.on(signal, async () => {
        await app.close();
        process.exit(0);
    });
});
const start = async () => {
    try {
        await app.listen({ port: 5000, host: "0.0.0.0" });
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
