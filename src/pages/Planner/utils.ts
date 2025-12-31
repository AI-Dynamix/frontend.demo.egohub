export const CELL_SIZE = 30; // Base unit, but in new design we map to % or flex? 
// Actually, new design implies pixel based grid on a fixed canvas size

export const getCanvasSize = (device: string, gridCols: number, gridRows: number) => {
    switch (device) {
        case 'phone': return { width: 375, height: 667 };
        case 'iphone-14': return { width: 390, height: 844 }; // iPhone 14
        case 'pixel-7': return { width: 412, height: 915 };   // Pixel 7
        case 'kiosk': return { width: 1080, height: 1920 };
        case 'ipad': return { width: 810, height: 1080 };     // iPad 9th Gen
        default: return { width: gridCols * 20, height: gridRows * 20 };
    }
};

export const getCellDimensions = (canvasW: number, canvasH: number, cols: number, rows: number) => {
    return {
        cellW: canvasW / cols,
        cellH: canvasH / rows
    };
};

export const snapToGrid = (x: number, y: number, cellW: number, cellH: number) => {
    return {
        x: Math.round(x / cellW) * cellW,
        y: Math.round(y / cellH) * cellH
    };
};

export const pixelToGrid = (x: number, y: number, cellW: number, cellH: number) => {
    return {
        col: Math.floor(x / cellW),
        row: Math.floor(y / cellH)
    };
};
