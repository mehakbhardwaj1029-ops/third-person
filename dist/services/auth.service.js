"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
async function registerUser(data) {
    const { email, password, name } = data;
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new Error("Not allowed");
    }
    //hash password
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    //create user
    const user = await prisma_1.default.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
        },
    });
    return user;
}
async function loginUser(data) {
    const { email, password } = data;
    const user = await prisma_1.default.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isValid = await bcrypt_1.default.compare(password, user.password);
    if (!isValid) {
        throw new Error("Invalid email or password");
    }
    const jwtsecret = process.env.JWT_SECRET;
    if (!jwtsecret) {
        throw new Error("JWT_SECRET is not defined in env");
    }
    //generate token
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, jwtsecret, { expiresIn: "1h" });
    return { accessToken: token };
}
