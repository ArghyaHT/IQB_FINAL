import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Allow all origins (Customize this for security)
            methods: ["GET", "POST"],
        },
        path: '/socket.io', // ✅ matches client
    });

    io.on('connection', (socket) => {
        console.log(`Client Connected: ${socket.id}`);

        
        // Handle joining a salon-specific room
        socket.on("joinSalon", (salonId) => {
            socket.join(`salon_${salonId}`);
            console.log(`Client ${socket.id} joined salon: salon_${salonId}`);
        });

        socket.on("joinBarber", ({ salonId, barberId }) => {
            const roomName = `barber_${salonId}_${barberId}`;
            socket.join(roomName);
            console.log(`Client ${socket.id} joined barber room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log(`Client Disconnected: ${socket.id}`);
        });
    });
};

// Exporting the socket instance
export { io };