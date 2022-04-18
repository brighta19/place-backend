import dotenv from "dotenv";
import { Server } from "socket.io";

dotenv.config();
const tiles = new Map<string, number>();

// AMOGUS
tiles.set("2,1", 7);
tiles.set("3,1", 7);
tiles.set("4,1", 7);
tiles.set("1,2", 7);
tiles.set("2,2", 7);
tiles.set("3,2", 8);
tiles.set("4,2", 8);
tiles.set("1,3", 7);
tiles.set("2,3", 7);
tiles.set("3,3", 7);
tiles.set("4,3", 7);
tiles.set("2,4", 7);
tiles.set("3,4", 7);
tiles.set("4,4", 7);
tiles.set("2,5", 7);
tiles.set("4,5", 7);


let origin = process.env.CORS_URLS?.split(",") || [];
const io = new Server({ cors: { origin } });

io.on("connection", (socket) => {
    console.log("New connection!");

    socket.emit("all-tiles", [...tiles]);

    socket.on("disconnect", () => {
        console.log("Socket disconnected.");
    });

    socket.on("place-tile", (data) => {
        let [ x, y, color ] = data;
        console.log(`New tile (x: ${x}, y: ${y})`);
        tiles.set([x, y].toString(), color);
        socket.broadcast.emit("new-tile", data);
    });
});

io.listen(3000);
