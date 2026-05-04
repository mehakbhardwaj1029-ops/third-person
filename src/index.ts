import 'dotenv/config';
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import cookie from '@fastify/cookie'
import { userRoutes } from "./routes/user.route";
import multipart from '@fastify/multipart';
import { uploadFileRoutes } from './routes/uploadFile.route';
import  rateLimit from '@fastify/rate-limit'

const app = Fastify({ logger: true });

app.register(cors,{
  origin: "http://localhost:5173",
});
app.register(cookie);
app.register(helmet);
app.register(jwt, {
    secret: process.env.JWT_SECRET || "supersecretkey",
});

app.register(multipart, {
   limits: {
      fileSize: 50 * 1024 * 1024 // 50 MB
   }
});

app.register(userRoutes, {prefix: '/api/users'});
app.register(uploadFileRoutes, {prefix: '/api/chats'});


// graceful shutdown
const listeners = ['SIGINT', 'SIGTERM']
listeners.forEach((signal) => {
  process.on(signal, async () => {
    await app.close()
    process.exit(0)
  })
});

const start = async () => {
  try {
    await app.register(rateLimit, {
      global: true,
      max: 5,
      timeWindow: '1 minute'
    })
    app.get("/health",async ()=>{
      return {status:"OK"}
    })
    await app.listen({ port: 5000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();