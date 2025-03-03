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

        // Handle joining a salon-specific room
        socket.on("joinSalon", (salonId) => {
            socket.join(`salon_${salonId}`);
            console.log(`Client ${socket.id} joined salon: salon_${salonId}`);
        });

        // Join a room for a specific barber in a salon
        socket.on("joinSalonBarber", ({ salonId, barberId }) => {
            const barberRoom = `salon_${salonId}_barber_${barberId}`;
            socket.join(barberRoom);
            console.log(`Client ${socket.id} joined barber room: ${barberRoom}`);
        });

        socket.on('disconnect', () => {
            console.log(`Client Disconnected: ${socket.id}`);
        });
    });
};

// Exporting the socket instance
export { io };
