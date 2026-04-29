import Fastify from "fastify";
const app = Fastify({ logger: true });
app.get("/", async () => {
    return { message: "Backend is running!" };
});
const start = async () => {
    try {
        await app.listen({ port: 5000, host: "0.0.0.0" });
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
