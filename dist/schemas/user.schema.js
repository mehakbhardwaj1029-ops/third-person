"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginResponseSchema = exports.loginUserSchema = exports.createUserResponseSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
//data needed foe user to register
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email adress").toLowerCase().trim(),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
    name: zod_1.z.string().min(1).trim(),
}).strict();
//response for registering user
exports.createUserResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
    createdAt: zod_1.z.string().datetime(),
}).strict();
//login user scehma
exports.loginUserSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email adress").toLowerCase().trim(),
    password: zod_1.z.string().min(6),
}).strict();
//login response
exports.loginResponseSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
}).strict();
