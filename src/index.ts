import dotenv from "dotenv";
import { Server } from "socket.io";
import fs from "fs/promises";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const BACKUP_INTERVAL = Number(process.env.BACKUP_INTERVAL) || 30000; // milliseconds
const BACKUP_NAME = process.env.BACKUP_NAME || "tiles.backup.json";
const NUM_OF_COLORS = 12;

let rows: number;
let cols: number;
let tiles: Map<string, number>;

function init() {
    fs.readFile(BACKUP_NAME)
    .then((buffer: Buffer) => {
        try {
            let json = JSON.parse(buffer.toString());

            if (!readJsonAndSetup(json))
                throw new Error("Invalid format in backup");
            else
                console.log(`Retrieved backup "${BACKUP_NAME}"`);

            continueInit();
        }
        catch (err) {
            console.error(err);
            console.log(`An error has occurred while reading backup ${BACKUP_NAME}`);
            console.log(`To continue, either correct it, or delete the backup.`);
        }
    })
    .catch(async (err) => {
        console.log(`Could not open backup named "${BACKUP_NAME}"`);

        rows = Number(process.env.NUM_OF_ROWS) || 50;
        cols = Number(process.env.NUM_OF_COLS) || 50;
        tiles = new Map<string, number>();

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

        if (await writeToBackupFile(BACKUP_NAME))
            console.log("Created backup file");

        continueInit();
    });
}

function continueInit() {
    setInterval(() => writeToBackupFile(BACKUP_NAME), BACKUP_INTERVAL);

    const io = new Server({ cors: { origin: true } });

    io.on("connection", (socket) => {
        console.log("New connection!");

        socket.emit("current-state", {
            num_of_rows: rows,
            num_of_cols: cols,
            tiles: [...tiles]
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected.");
        });

        socket.on("place-tile", (data) => {
            if (!verifyTileData(data)) return;

            let [ x, y, color ] = data;
            console.log(`New tile (x: ${x}, y: ${y})`);
            tiles.set([x, y].toString(), color);
            socket.broadcast.emit("new-tile", data);
        });
    });

    io.listen(PORT);
    console.log(`Started websocket server on port ${PORT}`);
}

function verifyTileData(data: any) {
    return (
        Array.isArray(data) &&
        typeof data[0] === "number" &&
        data[0] >= 0 && data[0] < cols &&
        typeof data[1] === "number" &&
        data[1] >= 0 && data[1] < rows &&
        typeof data[2] === "number" &&
        data[2] >= 0 && data[2] < NUM_OF_COLORS
    );
}

async function writeToBackupFile(name: string) {
    try {
        await fs.writeFile(name, getCurrentState())
        return true;
    }
    catch (_err) {
        console.log("Couldn't write to backup file");
        return false;
    }
}

function getCurrentState() {
    return JSON.stringify({
        rows, cols,
        tiles: [...tiles]
    });
}

function readJsonAndSetup(json: any) {
    if (typeof json !== "object" ||
        typeof json["rows"] !== "number" ||
        typeof json["cols"] !== "number" ||
        !Array.isArray(json["tiles"])
    ) return false;

    let _tiles = new Map<string, number>();
    for (let tile of json["tiles"]) {
        if (!Array.isArray(tile) ||
            typeof tile[0] !== "string" ||
            !(/^\d+,\d+$/.test(tile[0])) ||
            typeof tile[1] !== "number" ||
            tile[1] < 0 || tile[1] >= NUM_OF_COLORS
        ) return false;

        _tiles.set(tile[0], tile[1]);
    }

    rows = json["rows"];
    cols = json["cols"];
    tiles = _tiles;
    return true;
}

init();
