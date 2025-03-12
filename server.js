// server.js
const { Server } = require("socket.io");
const http = require("http");
const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: "https://yogaconnectplus.netlify.app",
        methods: ["GET", "POST"]
    }
});

const rooms = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (data) => {
        const { room_type, room_id } = data;
        const room = `${room_type}_${room_id}`;

        socket.join(room);
        if (!rooms[room]) {
            rooms[room] = new Set();
        }
        rooms[room].add(socket.id);
        console.log(`User ${socket.id} joined ${room}`);
        socket.emit("join_success", { room });
    });

    socket.on("send_message", (data) => {
        const { room_type, room_id, content, sender, image } = data;
        const room = `${room_type}_${room_id}`;

        if (rooms[room] && rooms[room].has(socket.id)) {
            console.log(`Message to ${room}: ${content}${image ? ` (with image: ${image})` : ''}`);
            io.to(room).emit("new_message", {
                id: Date.now().toString(), // Temporary ID, Django provides real ID
                sender,
                content,
                image, // Relay the image URL
                timestamp: new Date().toISOString()
            });
        } else {
            socket.emit("error", { message: "Not in this room" });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        for (const room in rooms) {
            if (rooms[room].has(socket.id)) {
                rooms[room].delete(socket.id);
                if (rooms[room].size === 0) delete rooms[room];
            }
        }
    });
});

const PORT = 4000;
server.listen(PORT, () => {
    console.log(`Socket.IO server running on http://localhost:${PORT}`);
});