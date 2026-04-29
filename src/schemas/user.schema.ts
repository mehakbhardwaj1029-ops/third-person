import {z} from 'zod';

//data needed foe user to register
export const createUserSchema = z.object({
    email:z.string().email("Invalid email adress").toLowerCase().trim(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    name: z.string().min(1).trim(),
}).strict();

//response for registering user

export const createUserResponseSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    createdAt: z.string().datetime(),
}).strict();

//login user scehma
export const loginUserSchema = z.object({
    email:z.string().email("Invalid email adress").toLowerCase().trim(),
    password: z.string().min(6),
}).strict();

//login response
export const loginResponseSchema = z.object({

    accessToken: z.string(),

}).strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

