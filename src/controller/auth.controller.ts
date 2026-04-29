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
){
    try{

        //validate
        const data: CreateUserInput = createUserSchema.parse(request.body);

        //call service
        const user = await registerUser(data);

        //format response
        const response = createUserResponseSchema.parse({
            id: user.id,
            email:user.email,
            name: user.name,
            createdAt: user.createdAt.toISOString(),
        })
        return reply.code(201).send(response);

    }catch(error: any){
       request.log.error(error);

       if(error.name === "ZodError"){
        return reply.status(400).send({
            message: "Valiation failed",
            errors: error.errors,
        });
       }

       if(error.message === "Not allowed"){
        return reply.status(409).send({
            message: "User already exist",
            errors: error.errors,
        })
       }

       return reply.status(500).send({
        message: "Internal server error",
       })

    }
}

export async function loginController(
    request: FastifyRequest,
    reply: FastifyReply,
){

    try{
        //validate
       const data: LoginUserInput = loginUserSchema.parse(request.body);

       //call service
       const result = await loginUser(data);

       //validate response
       const response = loginResponseSchema.parse(result);

       return reply.code(200).send(response);

    }
    catch(error: any){

        if(error.name === "ZodError"){
            return reply.status(400).send({
            message: "Valiation failed",
            errors: error.errors,
        });
        }

        if(error.message === "Not allowed"){
            return reply.status(409).send({
            message: "User already exist",
            errors: error.errors,
        })
        }

        if (error.message === "Invalid email or password") {
        return reply.status(401).send({ message: error.message });
        }

        return reply.status(500).send({
            message: "Internal Server Error",
        })
    }

}


