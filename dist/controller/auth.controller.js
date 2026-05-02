"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerController = registerController;
exports.loginController = loginController;
const user_schema_1 = require("../schemas/user.schema");
const auth_service_1 = require("../services/auth.service");
async function registerController(request, reply) {
    try {
        //validate
        const data = user_schema_1.createUserSchema.parse(request.body);
        //call service
        const user = await (0, auth_service_1.registerUser)(data);
        //format response
        const response = user_schema_1.createUserResponseSchema.parse({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt.toISOString(),
        });
        return reply.code(201).send(response);
    }
    catch (error) {
        request.log.error(error);
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
            message: "Internal server error",
        });
    }
}
async function loginController(request, reply) {
    try {
        //validate
        const data = user_schema_1.loginUserSchema.parse(request.body);
        //call service
        const result = await (0, auth_service_1.loginUser)(data);
        //validate response
        const response = user_schema_1.loginResponseSchema.parse(result);
        return reply.code(200).send(response);
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
        if (error.message === "Invalid email or password") {
            return reply.status(401).send({ message: error.message });
        }
        return reply.status(500).send({
            message: "Internal Server Error",
        });
    }
}
