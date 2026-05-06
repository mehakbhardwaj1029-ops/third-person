import { FastifyRequest , FastifyReply } from "fastify";
import {
 CreateUserInput,
 CreateUserResponse,
 LoginUserInput,
 LoginResponse,
 createUserSchema,
 createUserResponseSchema,
 loginUserSchema,
 loginResponseSchema
} from '../schemas/user.schema'; 
import { registerUser, loginUser } from "../services/auth.service";

export async function registerController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const log = request.log;

  try {
    log.info("Register request received");

    const data: CreateUserInput = createUserSchema.parse(request.body);

    const user = await registerUser(data, { log });

    const response = createUserResponseSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    });

    log.info({ userId: response.id }, "User registered");

    return reply.code(201).send(response);

  } catch (error: any) {
    log.error(error, "Register failed");

    if (error.name === "ZodError") {
      return reply.status(400).send({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.message === "Not allowed") {
      return reply.status(409).send({
        message: "User already exists",
      });
    }

    return reply.status(500).send({
      message: "Internal server error",
    });
  }
}

export async function loginController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const log = request.log;

  try {
    log.info("Login request received");

    const data: LoginUserInput = loginUserSchema.parse(request.body);

    const result = await loginUser(data, { log });

    const response = loginResponseSchema.parse(result);

    log.info({ email: data.email }, "Login success");

    return reply.code(200).send(response);

  } catch (error: any) {
    log.error(error, "Login failed");

    if (error.name === "ZodError") {
      return reply.status(400).send({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.message === "Invalid email or password") {
      return reply.status(401).send({ message: error.message });
    }

    return reply.status(500).send({
      message: "Internal Server Error",
    });
  }
}


