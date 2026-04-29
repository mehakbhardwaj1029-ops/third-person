import { FastifyInstance } from "fastify";
import { loginController, registerController } from "../controller/auth.controller";


export async function userRoutes(app: FastifyInstance ){

    // app.get('/',(request: FastifyRequest, reply: FastifyReply)=>{
    //     reply.send({message: '/ route hit'})
    // });

    app.post('/register',{
        handler: registerController
    });
    app.post('/login',{
        handler: loginController
    });
    app.delete('/delete',()=>{});
    app.log.info('user route registered');

}