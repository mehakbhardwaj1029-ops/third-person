import { FastifyInstance } from "fastify";
import { loginController, registerController } from "../controller/auth.controller";


export async function userRoutes(app: FastifyInstance ){

    app.post('/register',{
        handler: registerController
    });
    app.post('/login',{
        handler: loginController
    });
    app.delete('/delete',()=>{});
    app.log.info('user route registered');

}