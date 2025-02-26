import { Server } from 'socket.io';


let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Allow all origins (Customize this for security)
            methods: ["GET", "POST"],

        }
    });

    io.on('connection', (socket) => {
        console.log(`Client Connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`Client Disconnected: ${socket.id}`);
        });
    });
};

export { io };
