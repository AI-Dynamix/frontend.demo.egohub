import { useState } from 'react';
import { usePlannerStore } from '../store';
import { CaretRight, Plus, Folder, Monitor, SquaresFour, FloppyDisk, ArrowLeft } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const ProjectTree = () => {
    const { project, currentMode, currentItemId, selectItem, addLayout, addScreen } = usePlannerStore();

    // Local state for toggling sections
    const [isLayoutsOpen, setIsLayoutsOpen] = useState(true);
    const [isScreensOpen, setIsScreensOpen] = useState(true);

    const handleAddLayout = (e: React.MouseEvent) => {
        e.stopPropagation();
        const name = prompt("Enter Layout Name:");
        if (name) {
            const id = name.toLowerCase().replace(/\s+/g, '-');
            addLayout(id, name);
        }
    };

    const handleAddScreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const name = prompt("Enter Screen Name:");
        if (name) {
            const id = name.toLowerCase().replace(/\s+/g, '-');
            addScreen(id, name);
        }
    };

    return (
        <div className="w-[280px] min-w-[280px] bg-[#12121a] border-r border-[#2a2a3d] flex flex-col h-full text-[#f0f0f5]">
            <div className="h-[52px] px-4 border-b border-[#2a2a3d] flex items-center justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8888a0]">📁 Project</span>
                <span className="text-xs text-[#555566]">{project.name}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {/* Layouts Section */}
                <div className="mb-4">
                    <div
                        className="flex items-center px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#555566] cursor-pointer hover:bg-[#24243a] rounded-md transition-colors group"
                        onClick={() => setIsLayoutsOpen(!isLayoutsOpen)}
                    >
                        <CaretRight
                            size={12}
                            className={clsx("mr-2 transition-transform", isLayoutsOpen && "rotate-90")}
                        />
                        <span>Layouts</span>
                        <button
                            onClick={handleAddLayout}
                            className="ml-auto w-5 h-5 flex items-center justify-center rounded hover:bg-[#6366f1] hover:text-white text-[#555566] transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <AnimatePresence>
                        {isLayoutsOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pl-2 mt-1 overflow-hidden"
                            >
                                {Object.values(project.layouts).map(layout => (
                                    <div
                                        key={layout.id}
                                        onClick={() => selectItem('layout', layout.id)}
                                        className={clsx(
                                            "flex items-center px-3 py-2 text-[13px] cursor-pointer rounded-md my-0.5 transition-colors",
                                            (currentMode === 'layout' && currentItemId === layout.id)
                                                ? "bg-[#4f46e5] text-white"
                                                : "text-[#8888a0] hover:bg-[#24243a] hover:text-[#f0f0f5]"
                                        )}
                                    >
                                        <SquaresFour size={14} className="mr-2.5 opacity-70" />
                                        <span className="truncate">{layout.name}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Screens Section */}
                <div className="mb-4">
                    <div
                        className="flex items-center px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#555566] cursor-pointer hover:bg-[#24243a] rounded-md transition-colors group"
                        onClick={() => setIsScreensOpen(!isScreensOpen)}
                    >
                        <CaretRight
                            size={12}
                            className={clsx("mr-2 transition-transform", isScreensOpen && "rotate-90")}
                        />
                        <span>Screens</span>
                        <button
                            onClick={handleAddScreen}
                            className="ml-auto w-5 h-5 flex items-center justify-center rounded hover:bg-[#6366f1] hover:text-white text-[#555566] transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <AnimatePresence>
                        {isScreensOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pl-2 mt-1 overflow-hidden"
                            >
                                {Object.values(project.screens).map(screen => (
                                    <div
                                        key={screen.id}
                                        onClick={() => selectItem('screen', screen.id)}
                                        className={clsx(
                                            "flex items-center px-3 py-2 text-[13px] cursor-pointer rounded-md my-0.5 transition-colors",
                                            (currentMode === 'screen' && currentItemId === screen.id)
                                                ? "bg-[#4f46e5] text-white"
                                                : "text-[#8888a0] hover:bg-[#24243a] hover:text-[#f0f0f5]"
                                        )}
                                    >
                                        <Monitor size={14} className="mr-2.5 opacity-70" />
                                        <span className="truncate flex-1">{screen.name}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const json = JSON.stringify(screen, null, 2);
                                                navigator.clipboard.writeText(json);
                                                alert(`Screen "${screen.name}" JSON copied!`);
                                            }}
                                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#6366f1] hover:text-white text-[#555566] transition-colors opacity-0 group-hover:opacity-100"
                                            title="Copy Screen JSON"
                                        >
                                            <FloppyDisk size={12} />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer - Back Button */}
            <div className="p-3 border-t border-[#2a2a3d] bg-[#12121a]">
                <button
                    onClick={() => window.location.href = '/engineering'}
                    className="w-full h-9 rounded bg-[#2a2a3d] hover:bg-[#3f3f5a] flex items-center justify-center gap-2 text-xs font-medium text-[#f0f0f5] transition-colors"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Engineer</span>
                </button>
            </div>
        </div>
    );
};
