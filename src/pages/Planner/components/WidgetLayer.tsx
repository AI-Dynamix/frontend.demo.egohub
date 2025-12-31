import { usePlannerStore } from '../store';
import type { Widget } from '../types';
import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { Trash, Copy, TextT, PencilSimple, Check, X } from '@phosphor-icons/react';

const PortalToolbar = ({ anchorEl, children }: { anchorEl: HTMLElement, children: React.ReactNode }) => {
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useLayoutEffect(() => {
        const updatePosition = () => {
            if (!anchorEl) return;
            const rect = anchorEl.getBoundingClientRect();
            setCoords({
                top: rect.top - 60, // Position above the widget
                left: rect.left + rect.width / 2
            });
        };

        updatePosition();
        // Capture scroll events from any parent (like the canvas container)
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [anchorEl]);

    return createPortal(
        <div
            className="fixed z-[9999] flex flex-col items-center pointer-events-auto"
            style={{
                top: coords.top,
                left: coords.left,
                transform: 'translateX(-50%)'
            }}
        >
            {children}
        </div>,
        document.body
    );
};

interface WidgetLayerProps {
    width: number;
    height: number;
    cellW: number;
    cellH: number;
    onResizeStart: (id: string, direction: string, e: React.MouseEvent) => void;
    onDragStart: (id: string, e: React.MouseEvent) => void;
}

export const WidgetLayer = ({ cellW, cellH, onResizeStart, onDragStart }: WidgetLayerProps) => {
    const { project, currentMode, currentItemId, selectedWidgetId, selectWidget, deleteWidget, duplicateWidget, updateWidget, setEditingWidgetId } = usePlannerStore();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Get widgets to display
    const { screenWidgets, layoutWidgets } = useMemo(() => {
        let sWidgets: Widget[] = [];
        let lWidgets: Widget[] = [];

        if (currentMode === 'screen' && currentItemId) {
            const screen = project.screens[currentItemId];
            if (screen) {
                sWidgets = screen.widgets;
                if (screen.layoutId && project.layouts[screen.layoutId]) {
                    lWidgets = project.layouts[screen.layoutId].widgets;
                }
            }
        } else if (currentMode === 'layout' && currentItemId) {
            const layout = project.layouts[currentItemId];
            if (layout) {
                lWidgets = layout.widgets;
            }
        }
        return { screenWidgets: sWidgets, layoutWidgets: lWidgets };
    }, [project, currentMode, currentItemId]);

    return (
        <>
            {/* Render Layout Widgets (Background) */}
            {layoutWidgets.map(w => (
                <div
                    key={w.id}
                    className={clsx(
                        "absolute border border-[#22c55e]/40 bg-[#22c55e]/10 flex items-center justify-center text-xs font-mono text-[#22c55e] opacity-60 pointer-events-none",
                        // If editing layout, these are interactive
                        currentMode === 'layout' && "pointer-events-auto opacity-100 hover:bg-[#22c55e]/20 border-dashed hover:border-solid cursor-move"
                    )}
                    style={{
                        left: w.col * cellW,
                        top: w.row * cellH,
                        width: w.colSpan * cellW,
                        height: w.rowSpan * cellH
                    }}
                    onMouseDown={(e) => {
                        if (currentMode === 'layout') {
                            e.stopPropagation();
                            selectWidget(w.id);
                            onDragStart(w.id, e);
                        }
                    }}
                >
                    {w.name}
                </div>
            ))}

            {/* Render Screen Widgets (Foreground) */}
            {screenWidgets.map(w => (
                <div
                    key={w.id}
                    className={clsx(
                        "absolute border-2 flex items-center justify-center text-xs font-mono text-[#8888a0] cursor-move transition-colors group",
                        // Default border dashed if not selected, solid if selected
                        selectedWidgetId === w.id
                            ? "border-solid border-[#6366f1] shadow-[0_0_0_3px_rgba(99,102,241,0.2)] z-20"
                            : "border-dashed border-[#6366f1]/40 hover:border-[#6366f1] z-10"
                    )}
                    style={{
                        left: w.col * cellW,
                        top: w.row * cellH,
                        width: w.colSpan * cellW,
                        height: w.rowSpan * cellH,
                        backgroundColor: w.color || 'rgba(99, 102, 241, 0.1)' // Use widget color or default
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        selectWidget(w.id);
                        onDragStart(w.id, e);
                    }}
                >
                    <div className="flex flex-col items-center pointer-events-none select-none drop-shadow-md text-white">
                        <span className="font-medium">{w.name}</span>
                        {w.componentId && <span className="text-[9px] opacity-70 font-mono">{w.componentId}</span>}
                    </div>

                    {/* Toolbar & Resize Handles (Only when selected) */}
                    {selectedWidgetId === w.id && (
                        <>
                            <div ref={setAnchorEl} className="absolute inset-0 pointer-events-none">
                                {anchorEl && (
                                    <PortalToolbar anchorEl={anchorEl}>
                                        <div className="bg-[#12121a] border border-[#2a2a3d] rounded-lg shadow-xl p-1.5 flex items-center gap-1">
                                            {/* Color Picker */}
                                            <div className="flex items-center gap-1 mr-2 border-r border-[#2a2a3d] pr-2">
                                                {[
                                                    'rgba(99, 102, 241, 0.2)', // Indigo
                                                    'rgba(239, 68, 68, 0.2)', // Red
                                                    'rgba(34, 197, 94, 0.2)', // Green
                                                    'rgba(234, 179, 8, 0.2)', // Yellow
                                                    'rgba(168, 85, 247, 0.2)', // Purple
                                                    'rgba(236, 72, 153, 0.2)', // Pink
                                                ].map(c => (
                                                    <button
                                                        key={c}
                                                        className="w-4 h-4 rounded-full border border-white/10 hover:scale-110 transition-transform"
                                                        style={{ backgroundColor: c }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateWidget(w.id, { color: c });
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            <button
                                                className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#24243a] text-[#8888a0] hover:text-[#f0f0f5]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingWidgetId(w.id);
                                                }}
                                                title="Edit"
                                            >
                                                <PencilSimple size={14} />
                                            </button>
                                            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#24243a] text-[#8888a0] hover:text-[#f0f0f5]" onClick={(e) => { e.stopPropagation(); duplicateWidget(w.id); }}>
                                                <Copy size={14} />
                                            </button>

                                            {confirmDeleteId === w.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        className="w-7 h-7 flex items-center justify-center rounded bg-[#ef4444] text-white hover:bg-[#dc2626]"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteWidget(w.id);
                                                            setConfirmDeleteId(null);
                                                        }}
                                                        title="Confirm Delete"
                                                    >
                                                        <Check size={14} weight="bold" />
                                                    </button>
                                                    <button
                                                        className="w-7 h-7 flex items-center justify-center rounded bg-[#2a2a3d] text-[#f0f0f5] hover:bg-[#3f3f5a]"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmDeleteId(null);
                                                        }}
                                                        title="Cancel"
                                                    >
                                                        <X size={14} weight="bold" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#ef4444] text-[#8888a0] hover:text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteId(w.id);
                                                    }}
                                                    title="Delete"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </PortalToolbar>
                                )}
                            </div>

                            {/* Resize Handles */}
                            {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(dir => (
                                <div
                                    key={dir}
                                    className={clsx(
                                        "absolute bg-[#6366f1] z-30",
                                        dir === 'n' && "top-[-3px] left-[20%] right-[20%] h-[6px] cursor-ns-resize rounded-[2px]",
                                        dir === 's' && "bottom-[-3px] left-[20%] right-[20%] h-[6px] cursor-ns-resize rounded-[2px]",
                                        dir === 'e' && "right-[-3px] top-[20%] bottom-[20%] w-[6px] cursor-ew-resize rounded-[2px]",
                                        dir === 'w' && "left-[-3px] top-[20%] bottom-[20%] w-[6px] cursor-ew-resize rounded-[2px]",
                                        dir === 'nw' && "top-[-5px] left-[-5px] w-[10px] h-[10px] rounded-full cursor-nwse-resize border border-[#12121a]",
                                        dir === 'ne' && "top-[-5px] right-[-5px] w-[10px] h-[10px] rounded-full cursor-nesw-resize border border-[#12121a]",
                                        dir === 'sw' && "bottom-[-5px] left-[-5px] w-[10px] h-[10px] rounded-full cursor-nesw-resize border border-[#12121a]",
                                        dir === 'se' && "bottom-[-5px] right-[-5px] w-[10px] h-[10px] rounded-full cursor-nwse-resize border border-[#12121a]"
                                    )}
                                    onMouseDown={(e) => onResizeStart(w.id, dir, e)}
                                />
                            ))}
                        </>
                    )}
                </div >
            ))}
        </>
    );
};
