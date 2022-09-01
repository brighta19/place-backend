type TileLocation = string;
type TileColor = number;

interface CanvasData {
    rows: number;
    cols: number;
    tiles: Map<TileLocation, TileColor>;
}
