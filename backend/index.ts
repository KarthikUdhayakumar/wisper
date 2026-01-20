import app from "./src/app";
import { connectDB } from "./src/config/database";
import http from "http";
import { initializeSocket } from "./src/utils/socket";

const server = http.createServer(app);

initializeSocket(server);


const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});