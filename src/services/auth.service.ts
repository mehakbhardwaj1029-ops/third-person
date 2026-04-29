import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../utils/prisma";
import { CreateUserInput,LoginUserInput } from '../schemas/user.schema';


export async function registerUser(data: CreateUserInput){

    const { email,password,name }= data;

    const existingUser = await prisma.user.findUnique({
        where: {email},
    });

    if(existingUser){
        throw new Error("Not allowed");
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password,10);

    //create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
        },
        select: {
            id: true,
            email:true,
            name:true,
            createdAt:true,
        },
    });
   return user;
}

export async function loginUser(data: LoginUserInput){
    const { email,password } = data;

    const user = await prisma.user.findUnique({
        where: {email},
    });

    if(!user){
        throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password,user.password);
    if(!isValid){
        throw new Error("Invalid email or password");
    }

    const jwtsecret = process.env.JWT_SECRET
    if(!jwtsecret){
        throw new Error("JWT_SECRET is not defined in env")
    }
    //generate token
    const token = jwt.sign(
        {userId: user.id, email:user.email},
          jwtsecret as string,
        { expiresIn: "1h"},
    )

    return {accessToken: token};
}
