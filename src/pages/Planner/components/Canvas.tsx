import { useRef, useState, useMemo, useEffect } from 'react';
import { usePlannerStore } from '../store';
import { getCanvasSize, getCellDimensions, pixelToGrid, snapToGrid } from '../utils';
import { WidgetLayer } from './WidgetLayer';

export const Canvas = () => {
    const { project, showGrid, addWidget, currentItemId, selectWidget } = usePlannerStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Canvas dimensions based on device/grid settings
    // If Custom, use grid calculations. If Device, use fixed pixel sizes.
    const { width, height } = useMemo(() =>
        getCanvasSize(project.device, project.gridCols, project.gridRows),
        [project.device, project.gridCols, project.gridRows]
    );

    const { cellW, cellH } = useMemo(() =>
        getCellDimensions(width, height, project.gridCols, project.gridRows),
        [width, height, project.gridCols, project.gridRows]
    );

    // Auto-Fit Logic
    const { scale, setScale } = usePlannerStore();

    // ... (rest of dimension logic - fitting not shown here, assumed unchanged outside this block) ...
    // Note: I am replacing the block from line 11 to 39 to clean up the top.

    // Initial fit or when device changes
    useEffect(() => {
        if (containerRef.current) {
            const parent = containerRef.current.parentElement;
            if (parent) {
                const availW = parent.clientWidth - 80;
                const availH = parent.clientHeight - 80;
                const scaleW = availW / width;
                const scaleH = availH / height;
                setScale(Math.min(scaleW, scaleH));
            }
        }
    }, [width, height]);

    // Listen for '0' scale which acts as trigger for Fit
    useEffect(() => {
        if (scale === 0) {
            if (containerRef.current) {
                const parent = containerRef.current.parentElement;
                if (parent) {
                    const availW = parent.clientWidth - 80;
                    const availH = parent.clientHeight - 80;
                    const scaleW = availW / width;
                    const scaleH = availH / height;
                    setScale(Math.min(scaleW, scaleH));
                }
            }
        }
    }, [scale]);

    // Dragging & Resizing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [resizeState, setResizeState] = useState<{ id: string, dir: string, startCol: number, startRow: number, startSpanCol: number, startSpanRow: number, startX: number, startY: number } | null>(null);
    const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
    const [currentDraw, setCurrentDraw] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const handleResizeStart = (id: string, dir: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const widget = getCurrentWidget(id);
        if (!widget) return;

        setResizeState({
            id,
            dir,
            startCol: widget.col,
            startRow: widget.row,
            startSpanCol: widget.colSpan,
            startSpanRow: widget.rowSpan,
            startX: e.clientX,
            startY: e.clientY
        });
    };

    const [dragState, setDragState] = useState<{ id: string, startCol: number, startRow: number, startX: number, startY: number } | null>(null);

    const handleDragStart = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const widget = getCurrentWidget(id);
        if (!widget) return;

        setDragState({
            id,
            startCol: widget.col,
            startRow: widget.row,
            startX: e.clientX,
            startY: e.clientY
        });
    };

    const getCurrentWidget = (id: string) => {
        if (!currentItemId) return null;
        if (project.screens[currentItemId]) return project.screens[currentItemId].widgets.find(w => w.id === id);
        if (project.layouts[currentItemId]) return project.layouts[currentItemId].widgets.find(w => w.id === id);
        return null;
    };

    // Scaled dimensions for rendering
    // Avoid 0 scale issues
    const safeScale = scale || 1;
    const scaledWidth = width * safeScale;
    const scaledHeight = height * safeScale;
    const scaledCellW = cellW * safeScale;
    const scaledCellH = cellH * safeScale;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (resizeState) return;

        // Deselect if clicking on canvas background (and not on a widget, which is stopped by WidgetLayer)
        if (!((e.target as HTMLElement).closest('.widget'))) {
            selectWidget(null);
        }

        if (!wrapperRef.current) return;
        if ((e.target as HTMLElement).closest('.widget')) return;

        // Coords relative to the canvas element (which is now physically scaled)
        const rect = wrapperRef.current.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check bounds
        if (x < 0 || x > scaledWidth || y < 0 || y > scaledHeight) return;

        // Snap using SCALED cell dimensions, result is in pixels (scaled)
        const snapped = snapToGrid(x, y, scaledCellW, scaledCellH);

        setIsDrawing(true);
        setDrawStart(snapped);
        setCurrentDraw({ x: snapped.x, y: snapped.y, w: 0, h: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // DRAGGING Logic
        if (dragState) {
            e.preventDefault();
            const deltaXPixel = e.clientX - dragState.startX;
            const deltaYPixel = e.clientY - dragState.startY;

            const deltaCols = Math.round(deltaXPixel / scaledCellW);
            const deltaRows = Math.round(deltaYPixel / scaledCellH);

            const newCol = dragState.startCol + deltaCols;
            const newRow = dragState.startRow + deltaRows;

            if (newCol >= 0 && newRow >= 0) {
                usePlannerStore.getState().updateWidget(dragState.id, {
                    col: newCol,
                    row: newRow
                });
            }
            return;
        }

        // RESIZING logic
        if (resizeState) {
            e.preventDefault();
            const deltaXPixel = e.clientX - resizeState.startX;
            const deltaYPixel = e.clientY - resizeState.startY;

            const deltaCols = Math.round(deltaXPixel / scaledCellW);
            const deltaRows = Math.round(deltaYPixel / scaledCellH);

            const { id, dir, startCol, startRow, startSpanCol, startSpanRow } = resizeState;

            let newCol = startCol;
            let newRow = startRow;
            let newColSpan = startSpanCol;
            let newRowSpan = startSpanRow;

            switch (dir) {
                case 'e': newColSpan = Math.max(1, startSpanCol + deltaCols); break;
                case 'w':
                    const right = startCol + startSpanCol;
                    newCol = Math.min(right - 1, startCol + deltaCols);
                    newColSpan = right - newCol;
                    break;
                case 's': newRowSpan = Math.max(1, startSpanRow + deltaRows); break;
                case 'n':
                    const bottom = startRow + startSpanRow;
                    newRow = Math.min(bottom - 1, startRow + deltaRows);
                    newRowSpan = bottom - newRow;
                    break;
                case 'se':
                    newColSpan = Math.max(1, startSpanCol + deltaCols);
                    newRowSpan = Math.max(1, startSpanRow + deltaRows);
                    break;
                case 'sw':
                    const rightSW = startCol + startSpanCol;
                    newCol = Math.min(rightSW - 1, startCol + deltaCols);
                    newColSpan = rightSW - newCol;
                    newRowSpan = Math.max(1, startSpanRow + deltaRows);
                    break;
                case 'ne':
                    newColSpan = Math.max(1, startSpanCol + deltaCols);
                    const bottomNE = startRow + startSpanRow;
                    newRow = Math.min(bottomNE - 1, startRow + deltaRows);
                    newRowSpan = bottomNE - newRow;
                    break;
                case 'nw':
                    const rightNW = startCol + startSpanCol;
                    newCol = Math.min(rightNW - 1, startCol + deltaCols);
                    newColSpan = rightNW - newCol;
                    const bottomNW = startRow + startSpanRow;
                    newRow = Math.min(bottomNW - 1, startRow + deltaRows);
                    newRowSpan = bottomNW - newRow;
                    break;
            }

            usePlannerStore.getState().updateWidget(id, {
                col: newCol,
                row: newRow,
                colSpan: newColSpan,
                rowSpan: newRowSpan
            });
            return;
        }

        if (!isDrawing || !wrapperRef.current) return;

        const rect = wrapperRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Clamp to canvas bounds
        const clampedX = Math.max(0, Math.min(x, scaledWidth));
        const clampedY = Math.max(0, Math.min(y, scaledHeight));

        const snapped = snapToGrid(clampedX, clampedY, scaledCellW, scaledCellH);

        const minX = Math.min(drawStart.x, snapped.x);
        const minY = Math.min(drawStart.y, snapped.y);
        const w = Math.abs(snapped.x - drawStart.x);
        const h = Math.abs(snapped.y - drawStart.y);

        setCurrentDraw({ x: minX, y: minY, w, h });
    };

    const handleMouseUp = () => {
        if (dragState) {
            setDragState(null);
            return;
        }
        if (resizeState) {
            setResizeState(null);
            return;
        }
        if (!isDrawing) return;

        setIsDrawing(false);

        // Finalize
        if (currentDraw.w > 0 && currentDraw.h > 0) {
            const gridPos = pixelToGrid(currentDraw.x, currentDraw.y, scaledCellW, scaledCellH);

            // Grid-based dimensions
            const colSpan = Math.max(1, Math.round(currentDraw.w / scaledCellW));
            const rowSpan = Math.max(1, Math.round(currentDraw.h / scaledCellH));

            if (currentItemId) {
                addWidget({
                    id: crypto.randomUUID(),
                    name: `Widget ${Math.floor(Math.random() * 1000)}`,
                    type: 'placeholder',
                    col: gridPos.col,
                    row: gridPos.row,
                    colSpan,
                    rowSpan,
                    color: 'rgba(99, 102, 241, 0.2)' // Default color
                });
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex relative overflow-auto bg-[#181820]"
            onMouseMove={isDrawing || resizeState || dragState ? handleMouseMove : undefined}
            onMouseUp={isDrawing || resizeState || dragState ? handleMouseUp : undefined}
            onMouseDown={(e) => {
                if (e.target === containerRef.current) {
                    selectWidget(null);
                }
            }}
        >
            {/* Wrapper for Scaling */}
            <div
                ref={wrapperRef}
                style={{
                    width: scaledWidth,
                    height: scaledHeight,
                    minWidth: scaledWidth,
                    minHeight: scaledHeight,
                    // No transform scale, explicit size
                }}
                className="relative shadow-2xl bg-[#0a0a0f] rounded-none overflow-hidden ring-1 ring-[#2a2a3d] cursor-crosshair m-auto flex-shrink-0"
                onMouseDown={handleMouseDown}
            >
                {/* Grid Overlay */}
                {showGrid && (
                    <div className="absolute inset-0 pointer-events-none z-0"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
                              `,
                            backgroundSize: `${scaledCellW}px ${scaledCellH}px`
                        }}
                    />
                )}

                {/* Drawing Preview */}
                {isDrawing && (
                    <div
                        className="absolute border-2 border-dashed border-[#6366f1] bg-[#6366f1]/10 pointer-events-none z-50"
                        style={{
                            left: currentDraw.x,
                            top: currentDraw.y,
                            width: currentDraw.w,
                            height: currentDraw.h
                        }}
                    />
                )}

                {/* Widgets */}
                <WidgetLayer
                    width={scaledWidth}
                    height={scaledHeight}
                    cellW={scaledCellW}
                    cellH={scaledCellH}
                    onResizeStart={handleResizeStart}
                    onDragStart={handleDragStart}
                />
            </div>

            {/* Scale Info Overlay */}
            <div className="fixed bottom-4 right-4 bg-black/60 px-2 py-1 rounded text-xs text-white/50 pointer-events-none font-mono z-50">
                {Math.round(safeScale * 100)}%
            </div>
        </div>
    );
};
