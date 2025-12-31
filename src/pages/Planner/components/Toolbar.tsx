import { useNavigate } from 'react-router-dom';
import { usePlannerStore } from '../store';
import type { DeviceType } from '../types';
import { GridFour, FloppyDisk, DownloadSimple, ArrowsOutSimple, ArrowLeft } from '@phosphor-icons/react';
import { clsx } from 'clsx';

export const Toolbar = () => {
    const {
        project,
        showGrid,
        toggleGrid,
        setDevice,
        setGridSize
    } = usePlannerStore();

    // Copy JSON to clipboard
    const handleCopyJSON = () => {
        const json = JSON.stringify(project, null, 2);
        navigator.clipboard.writeText(json);
        alert("Project JSON copied to clipboard!");
    };

    return (
        <div className="h-[52px] bg-[#12121a] border-b border-[#2a2a3d] flex items-center px-4 gap-3">
            {/* Grid Settings */}
            <div className="flex items-center gap-2 px-3 border-r border-[#2a2a3d]">
                <span className="text-xs text-[#555566]">Grid:</span>
                <input
                    type="number"
                    value={project.gridCols}
                    onChange={(e) => setGridSize(parseInt(e.target.value), project.gridRows)}
                    className="w-12 h-8 bg-[#1a1a24] border border-[#2a2a3d] rounded text-xs text-center text-[#f0f0f5] focus:border-[#6366f1] outline-none"
                />
                <span className="text-xs text-[#555566]">×</span>
                <input
                    type="number"
                    value={project.gridRows}
                    onChange={(e) => setGridSize(project.gridCols, parseInt(e.target.value))}
                    className="w-12 h-8 bg-[#1a1a24] border border-[#2a2a3d] rounded text-xs text-center text-[#f0f0f5] focus:border-[#6366f1] outline-none"
                />
                <button
                    onClick={toggleGrid}
                    className={clsx(
                        "h-8 px-3 ml-2 rounded flex items-center gap-2 text-xs font-medium transition-colors border",
                        showGrid
                            ? "bg-[#4f46e5]/20 border-[#6366f1] text-[#6366f1]"
                            : "bg-[#1a1a24] border-[#2a2a3d] text-[#8888a0] hover:text-[#f0f0f5]"
                    )}
                >
                    <GridFour size={14} weight="bold" />
                    Grid
                </button>
            </div>

            {/* Device Settings */}
            <div className="flex items-center gap-2 px-3 border-r border-[#2a2a3d]">
                <span className="text-xs text-[#555566]">Device:</span>
                <select
                    value={project.device}
                    onChange={(e) => setDevice(e.target.value as DeviceType)}
                    className="h-8 px-2 bg-[#1a1a24] border border-[#2a2a3d] rounded text-xs text-[#f0f0f5] focus:border-[#6366f1] outline-none min-w-[100px]"
                >
                    <option value="phone">Phone (375x667)</option>
                    <option value="iphone-14">iPhone 14 (390x844)</option>
                    <option value="pixel-7">Pixel 7 (412x915)</option>
                    <option value="ipad">iPad (810x1080)</option>
                    <option value="kiosk">Kiosk (1080x1920)</option>
                    <option value="custom">Custom</option>
                </select>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 px-3 border-r border-[#2a2a3d]">
                <button
                    onClick={() => usePlannerStore.getState().setScale(Math.max(0.1, usePlannerStore.getState().scale - 0.1))}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#24243a] text-[#8888a0]"
                >
                    -
                </button>
                <div className="text-xs text-[#f0f0f5] w-10 text-center">
                    {Math.round(usePlannerStore.getState().scale * 100)}%
                </div>
                <button
                    onClick={() => usePlannerStore.getState().setScale(Math.min(3, usePlannerStore.getState().scale + 0.1))}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#24243a] text-[#8888a0]"
                >
                    +
                </button>
                <button
                    onClick={() => usePlannerStore.getState().setScale(0)} // 0 = trigger auto-fit
                    className="h-8 w-8 rounded bg-[#1a1a24] border border-[#2a2a3d] flex items-center justify-center text-[#8888a0] hover:text-[#f0f0f5] transition-colors ml-1"
                    title="Fit to Screen"
                >
                    <ArrowsOutSimple size={14} />
                </button>
            </div>

            {/* Actions */}
            {/* Actions */}
            <div className="ml-auto flex items-center gap-2">
                <button
                    disabled={!usePlannerStore.getState().selectedWidgetId}
                    onClick={() => usePlannerStore.getState().setEditingWidgetId(usePlannerStore.getState().selectedWidgetId)}
                    className="h-8 px-3 rounded bg-[#1a1a24] border border-[#2a2a3d] flex items-center gap-2 text-xs font-medium text-[#8888a0] hover:text-[#f0f0f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowLeft size={14} className="rotate-180" /> {/* Using arrow as edit icon placeholder or just text */}
                    Edit
                </button>
                <button
                    disabled={!usePlannerStore.getState().selectedWidgetId}
                    onClick={() => {
                        const id = usePlannerStore.getState().selectedWidgetId;
                        if (id) usePlannerStore.getState().deleteWidget(id);
                    }}
                    className="h-8 px-3 rounded bg-[#1a1a24] border border-[#ef4444]/30 hover:border-[#ef4444] flex items-center gap-2 text-xs font-medium text-[#ef4444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Delete
                </button>

                <div className="w-[1px] h-4 bg-[#2a2a3d] mx-1" />

                <button
                    onClick={handleCopyJSON}
                    className="h-8 px-3 rounded bg-[#1a1a24] border border-[#2a2a3d] flex items-center gap-2 text-xs font-medium text-[#8888a0] hover:text-[#f0f0f5] transition-colors"
                >
                    <FloppyDisk size={14} />
                    Copy JSON
                </button>
                <button
                    className="h-8 px-3 rounded bg-[#6366f1] border border-[#6366f1] flex items-center gap-2 text-xs font-medium text-white hover:bg-[#818cf8] transition-colors"
                >
                    <DownloadSimple size={14} weight="bold" />
                    Export
                </button>
            </div>
        </div>
    );
};
