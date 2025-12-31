import { ProjectTree } from './components/ProjectTree';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { EditWidgetModal } from './components/EditWidgetModal';
import { PropertiesPanel } from './components/PropertiesPanel';
import { usePlannerStore } from './store';
import { useMemo } from 'react';

export default function PlannerPage() {
    // ... (store hooks same as before)
    const {
        project,
        currentMode,
        currentItemId,
        editingWidgetId,
        setEditingWidgetId,
        updateWidget
    } = usePlannerStore();

    // ... (editingWidget memo same as before)
    const editingWidget = useMemo(() => {
        if (!editingWidgetId || !currentItemId) return null;
        const list = currentMode === 'screen'
            ? project.screens[currentItemId]?.widgets
            : project.layouts[currentItemId]?.widgets;

        if (currentMode === 'screen') {
            const screen = project.screens[currentItemId];
            let w = screen?.widgets.find(w => w.id === editingWidgetId);
            if (!w && screen?.layoutId) {
                w = project.layouts[screen.layoutId]?.widgets.find(w => w.id === editingWidgetId);
            }
            return w;
        }
        return project.layouts[currentItemId]?.widgets.find(w => w.id === editingWidgetId);
    }, [editingWidgetId, project, currentMode, currentItemId]);

    return (
        <div className="flex h-screen w-screen bg-[#0a0a0f] text-[#f0f0f5] overflow-hidden">
            {/* Left Panel - Project Tree */}
            <ProjectTree />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 border-l border-[#2a2a3d]">
                <Toolbar />

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex flex-col relative min-w-0">
                        <div className="flex-1 relative overflow-hidden bg-[#0a0a0f]">
                            <Canvas />
                        </div>

                        {/* Status Bar */}
                        <div className="h-7 bg-[#12121a] border-t border-[#2a2a3d] flex items-center px-4 justify-between text-[11px] text-[#555566] shrink-0 z-40">
                            <span>UI Placeholder Designer v1.0</span>
                            <div className="flex gap-4">
                                <span>Ready</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Properties */}
                    <PropertiesPanel />
                </div>
            </div>

            {/* Global Edit Widget Modal */}
            <EditWidgetModal
                isOpen={!!editingWidget && !!editingWidgetId}
                onClose={() => setEditingWidgetId(null)}
                initialName={editingWidget?.name || ''}
                initialComponentId={editingWidget?.componentId || ''}
                onSave={(name, componentId) => {
                    if (editingWidgetId) {
                        updateWidget(editingWidgetId, { name, componentId });
                    }
                }}
            />
        </div>
    );
}
