"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = userRoutes;
const auth_controller_1 = require("../controller/auth.controller");
async function userRoutes(app) {
    // app.get('/',(request: FastifyRequest, reply: FastifyReply)=>{
    //     reply.send({message: '/ route hit'})
    // });
    app.post('/register', {
        handler: auth_controller_1.registerController
    });
    app.post('/login', {
        handler: auth_controller_1.loginController
    });
    app.delete('/delete', () => { });
    app.log.info('user route registered');
}
