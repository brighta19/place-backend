import dotenv from "dotenv";
import { Server } from "socket.io";
import fs from "fs";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const BACKUP_INTERVAL = Number(process.env.BACKUP_INTERVAL) || 30000; // milliseconds
const ORIGIN = process.env.CORS_URLS?.split(",") || [];
const BACKUP_NAME = process.env.BACKUP_NAME || "tiles.backup.json";

let tiles: Map<string, number>;

try {
    let buffer = fs.readFileSync(BACKUP_NAME);
    let json = JSON.parse(buffer.toString());
    tiles = new Map<string, number>(json);
    console.log(`Retrieved backup "${BACKUP_NAME}"`);
}
catch (_err) {
    console.log(`No backup named "${BACKUP_NAME}"`);
    tiles = new Map<string, number>()
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
}

setTimeout(() => {
    fs.writeFile(BACKUP_NAME, JSON.stringify([...tiles]), (err) => {
        if (err)
            console.log("Couldn't write to backup file");
    });
}, BACKUP_INTERVAL);


const io = new Server({ cors: { origin: ORIGIN } });

io.on("connection", (socket) => {
    console.log("New connection!");

    socket.emit("all-tiles", [...tiles])

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

io.listen(PORT);
console.log(`Started websocket server on port ${PORT}`);
