import { usePlannerStore } from '../store';
import { useMemo } from 'react';
import { clsx } from 'clsx';
import { X, TextT, Cube, PaintBrush, Hash, ArrowsOut, Minus, Plus } from '@phosphor-icons/react';

// internal helper for nicer inputs
const NumberInput = ({ label, value, onChange, min = 0 }: { label: string, value: number, onChange: (v: number) => void, min?: number }) => (
    <div>
        <span className="text-[10px] text-[#555566] block mb-1">{label}</span>
        <div className="flex items-center bg-[#181820] border border-[#2a2a3d] rounded overflow-hidden">
            <button
                className="w-6 h-6 flex items-center justify-center text-[#8888a0] hover:text-white hover:bg-[#2a2a3d] transition-colors disabled:opacity-30"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
            >
                <Minus size={10} weight="bold" />
            </button>
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) onChange(val);
                }}
                className="flex-1 min-w-0 h-6 bg-transparent text-center text-xs text-[#f0f0f5] outline-none font-mono focus:bg-[#24243a]"
            />
            <button
                className="w-6 h-6 flex items-center justify-center text-[#8888a0] hover:text-white hover:bg-[#2a2a3d] transition-colors"
                onClick={() => onChange(value + 1)}
            >
                <Plus size={10} weight="bold" />
            </button>
        </div>
    </div>
);

export const PropertiesPanel = () => {
    // ... existing hook logic ...
    const {
        project,
        currentMode,
        currentItemId,
        selectedWidgetId,
        updateWidget,
        selectWidget
    } = usePlannerStore();

    const componentSuggestions = [
        'Header', 'Footer', 'Search Bar', 'Microphone', 'Carousel',
        'Service Matrix', 'Button', 'Map', 'Video Player', 'Camera View',
        'Weather Widget', 'Clock', 'SOS Button', 'Language Toggle'
    ];

    // ... existing memo logic ...
    const selectedWidget = useMemo(() => {
        if (!selectedWidgetId || !currentItemId) return null;

        if (currentMode === 'screen') {
            const screen = project.screens[currentItemId];
            let w = screen?.widgets.find(w => w.id === selectedWidgetId);
            if (!w && screen?.layoutId) {
                w = project.layouts[screen.layoutId]?.widgets.find(w => w.id === selectedWidgetId);
            }
            return w;
        } else {
            return project.layouts[currentItemId]?.widgets.find(w => w.id === selectedWidgetId);
        }
    }, [project, currentMode, currentItemId, selectedWidgetId]);

    if (!selectedWidget) {
        return (
            <div className="w-[280px] border-l border-[#2a2a3d] bg-[#0f0f15] flex flex-col items-center justify-center text-[#555566] p-4 text-center">
                <Cube size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Select a widget to view properties</p>
            </div>
        );
    }

    const handleChange = (key: string, value: any) => {
        updateWidget(selectedWidget.id, { [key]: value });
    };

    return (
        <div className="w-[280px] min-w-[280px] bg-[#0f0f15] border-l border-[#2a2a3d] flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="h-12 border-b border-[#2a2a3d] flex items-center justify-between px-4 bg-[#12121a]">
                <span className="font-semibold text-sm flex items-center gap-2">
                    <Cube size={16} className="text-[#6366f1]" />
                    Properties
                </span>
                <button
                    onClick={() => selectWidget(null)}
                    className="text-[#8888a0] hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">

                {/* Identity Section */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-[#555566] uppercase tracking-wider flex items-center gap-1">
                        <TextT size={12} /> Identity
                    </label>

                    <div className="space-y-2">
                        <div>
                            <span className="text-xs text-[#8888a0] block mb-1">Name</span>
                            <input
                                type="text"
                                value={selectedWidget.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                list="properties-component-suggestions"
                                className="w-full bg-[#181820] border border-[#2a2a3d] rounded px-2 py-1.5 text-xs focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none text-[#f0f0f5]"
                            />
                            <datalist id="properties-component-suggestions">
                                {componentSuggestions.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                        <div>
                            <span className="text-xs text-[#8888a0] block mb-1">Component ID</span>
                            <input
                                type="text"
                                value={selectedWidget.componentId || ''}
                                onChange={(e) => handleChange('componentId', e.target.value)}
                                placeholder="e.g., WeatherWidget"
                                className="w-full bg-[#181820] border border-[#2a2a3d] rounded px-2 py-1.5 text-xs focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none font-mono text-[#f0f0f5]"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-[#2a2a3d]" />

                {/* Layout Section */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-[#555566] uppercase tracking-wider flex items-center gap-1">
                        <ArrowsOut size={12} /> Layout
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                        <NumberInput
                            label="Column"
                            value={selectedWidget.col}
                            onChange={(v) => handleChange('col', v)}
                        />
                        <NumberInput
                            label="Row"
                            value={selectedWidget.row}
                            onChange={(v) => handleChange('row', v)}
                        />
                        <NumberInput
                            label="Width (Span)"
                            value={selectedWidget.colSpan}
                            min={1}
                            onChange={(v) => handleChange('colSpan', v)}
                        />
                        <NumberInput
                            label="Height (Span)"
                            value={selectedWidget.rowSpan}
                            min={1}
                            onChange={(v) => handleChange('rowSpan', v)}
                        />
                    </div>
                </div>

                <hr className="border-[#2a2a3d]" />

                {/* Appearance Section */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-[#555566] uppercase tracking-wider flex items-center gap-1">
                        <PaintBrush size={12} /> Appearance
                    </label>
                    <div>
                        <span className="text-xs text-[#8888a0] block mb-1">Background Color</span>
                        <div className="flex gap-2 flex-wrap">
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
                                    className={clsx(
                                        "w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-all",
                                        selectedWidget.color === c && "ring-2 ring-white ring-offset-1 ring-offset-[#0f0f15]"
                                    )}
                                    style={{ backgroundColor: c }}
                                    onClick={() => handleChange('color', c)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 mt-auto">
                    <div className="bg-[#181820] rounded p-2 text-[10px] font-mono text-[#555566] break-all">
                        ID: {selectedWidget.id}
                    </div>
                </div>

            </div>
        </div>
    );
};
