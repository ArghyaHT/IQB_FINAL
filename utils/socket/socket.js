import { Server } from 'socket.io';

let io;
const salonRooms = new Map(); // Store clients in rooms

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Customize this for security
            methods: ["GET", "POST"],
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client Connected: ${socket.id}`);

        // Handle joining salon queue room
        socket.on("joinSalonQueue", (salonId) => {
            if (!salonId) return;
            if (socket.rooms.has(`salon_${salonId}`)) return; // Prevent duplicate joins

            socket.join(`salon_${salonId}`);
            console.log(`Client ${socket.id} joined salon ${salonId}`);

            if (!salonRooms.has(salonId)) {
                salonRooms.set(salonId, new Set());
            }
            salonRooms.get(salonId).add(socket.id);
        });

        // Handle queue updates
        socket.on("updateQueue", (salonId, queueData) => {
            if (!salonId || !queueData || !Array.isArray(queueData)) {
                console.log("Invalid queue update data received");
                return;
            }
            console.log(`Updating queue for salon ${salonId}`);
            io.to(`salon_${salonId}`).emit("queueUpdated", queueData);
        });

        // Handle client disconnect
        socket.on("disconnect", () => {
            console.log(`Client Disconnected: ${socket.id}`);
            
            salonRooms.forEach((clients, salonId) => {
                if (clients.has(socket.id)) {
                    clients.delete(socket.id);
                    console.log(`Removed ${socket.id} from salon ${salonId}`);
                    if (clients.size === 0) {
                        salonRooms.delete(salonId);
                    }
                }
            });
        });
    });
};

export { io };
