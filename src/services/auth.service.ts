import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../utils/prisma";
import { CreateUserInput,LoginUserInput } from '../schemas/user.schema';
import { ServiceContext } from '../types/context';


export async function registerUser(
  data: CreateUserInput,
  ctx: ServiceContext
) {
  const { log } = ctx;
  const { email, password, name } = data;

  log.info({ email }, "Checking existing user");

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    log.warn({ email }, "User already exists");
    throw new Error("Not allowed");
  }

  log.info("Hashing password");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
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

  log.info({ userId: user.id }, "User created");

  return user;
}

export async function loginUser(
  data: LoginUserInput,
  ctx: ServiceContext
) {
  const { log } = ctx;
  const { email, password } = data;

  log.info({ email }, "🔍 Finding user");

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    log.warn({ email }, "❌ User not found");
    throw new Error("Invalid email or password");
  }

  log.info("🔐 Comparing password");

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    log.warn({ email }, "❌ Invalid password");
    throw new Error("Invalid email or password");
  }

  const jwtsecret = process.env.JWT_SECRET;

  if (!jwtsecret) {
    log.error("❌ JWT secret missing");
    throw new Error("JWT_SECRET is not defined in env");
  }

  log.info({ userId: user.id }, "Generating token");

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    jwtsecret,
    { expiresIn: "1h" }
  );

  log.info({ userId: user.id }, "Login successful");

  return { accessToken: token };
}