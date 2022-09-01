import dotenv from "dotenv";
import { Server } from "socket.io";
import fs from "fs/promises";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const BACKUP_INTERVAL = Number(process.env.BACKUP_INTERVAL) || 30000; // milliseconds
const BACKUP_NAME = process.env.BACKUP_NAME || "tiles.backup.json";
const NUM_OF_ROWS = Number(process.env.NUM_OF_ROWS) || 50;
const NUM_OF_COLS = Number(process.env.NUM_OF_COLS) || 50;
const NUM_OF_COLORS = 12;

let rows: number;
let cols: number;
let tiles: Map<TileLocation, TileColor>;

function start() {
    fs.readFile(BACKUP_NAME)
        .then((buffer: Buffer) => {
            let json: any;

            try {
                json = JSON.parse(buffer.toString());

                if (!validateCanvasJSON(json))
                    throw new Error("Invalid format in backup");
            }
            catch (err) {
                console.error(err);
                console.error(
                    `An error has occurred while reading backup file ${BACKUP_NAME}\n` +
                    `To continue, either correct it, or delete the backup.`
                );
                return;
            }

            const extractedTileData = extractCanvasData(json);
            rows = extractedTileData.rows;
            cols = extractedTileData.cols;
            tiles = extractedTileData.tiles;

            console.log(`Retrieved backup "${BACKUP_NAME}"`);
        })
        .catch(async (err) => {
            console.log(`Could not open backup named "${BACKUP_NAME}"`);

            rows = NUM_OF_ROWS;
            cols = NUM_OF_COLS;
            tiles = new Map<TileLocation, TileColor>();

            drawAmogus();

            const writeSuccessful = await writeToBackupFile(BACKUP_NAME);
            if (writeSuccessful)
                console.log("Created backup file");
        })
        .finally(() => {
            setInterval(() => writeToBackupFile(BACKUP_NAME), BACKUP_INTERVAL);

            const socketServer = new Server({ cors: { origin: true } });

            socketServer.on("connection", (socket) => {
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

            socketServer.listen(PORT);
            console.log(`Started websocket server on port ${PORT}`);
        });
}

function verifyTileData(data: any): boolean {
    const LOCATION_X = 0;
    const LOCATION_Y = 1;
    const COLOR = 2;

    return (
        Array.isArray(data) &&
        typeof data[LOCATION_X] === "number" &&
        data[LOCATION_X] >= 0 && data[LOCATION_X] < cols &&
        typeof data[LOCATION_Y] === "number" &&
        data[LOCATION_Y] >= 0 && data[LOCATION_Y] < rows &&
        typeof data[COLOR] === "number" &&
        data[COLOR] >= 0 && data[COLOR] < NUM_OF_COLORS
    );
}

async function writeToBackupFile(name: string): Promise<boolean> {
    try {
        await fs.writeFile(name, getCanvasStateInJSON())
        return true;
    }
    catch (err) {
        console.log("Couldn't write to backup file", err);
        return false;
    }
}

function getCanvasStateInJSON(): string {
    return JSON.stringify({
        rows,
        cols,
        tiles: [...tiles]
    });
}

function validateCanvasJSON(json: any): boolean {
    const LOCATION = 0;
    const COLOR = 1;

    if (
        typeof json !== "object" ||
        typeof json["rows"] !== "number" ||
        typeof json["cols"] !== "number" ||
        !Array.isArray(json["tiles"])
    ) return false;

    for (let tile of json["tiles"]) {
        if (
            !Array.isArray(tile) ||
            !isValidTileLocation(tile[LOCATION]) ||
            !isValidTileColor(tile[COLOR])
        ) return false;
    }

    return true;
}

function isValidTileLocation(location: any): boolean {
    return typeof location === "string" &&
        /^\d+,\d+$/.test(location);
}

function isValidTileColor(color: any): boolean {
    return typeof color === "number" &&
        color >= 0 && color < NUM_OF_COLORS;
}

function extractCanvasData(json: any): CanvasData {
    return {
        rows: json["rows"],
        cols: json["cols"],
        tiles: new Map<string, number>(json["tiles"])
    }
}

function drawAmogus() {
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

start();

