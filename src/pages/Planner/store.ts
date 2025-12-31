import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectData, PlannerState, Widget, DeviceType } from './types';

interface PlannerStore extends PlannerState {
    // Actions
    setProject: (project: ProjectData) => void;
    setDevice: (device: DeviceType) => void;
    setGridSize: (cols: number, rows: number) => void;
    toggleGrid: () => void;
    setScale: (scale: number) => void;
    selectItem: (mode: 'screen' | 'layout', id: string) => void;
    // Modals
    editingWidgetId: string | null;
    setEditingWidgetId: (id: string | null) => void;
}

const DEFAULT_PROJECT: ProjectData = {
    name: 'Untitled Project',
    version: '1.0.0',
    gridCols: 36,
    gridRows: 64,
    device: 'phone', // Default as per doc
    layouts: {
        'default': { id: 'default', name: 'Default Layout', widgets: [] }
    },
    screens: {
        'home': { id: 'home', name: 'Home Screen', layoutId: 'default', scrollType: 'fixed', widgets: [] }
    }
};

export const usePlannerStore = create<PlannerStore>()(
    persist(
        (set, get) => ({
            project: DEFAULT_PROJECT,
            currentMode: 'screen',
            currentItemId: 'home',
            selectedWidgetId: null,
            editingWidgetId: null,
            showGrid: true,
            scale: 0.4, // Default kiosk scale

            setProject: (project) => set({ project }),

            setDevice: (device) => set((state) => ({
                project: { ...state.project, device }
            })),

            setGridSize: (gridCols, gridRows) => set((state) => ({
                project: { ...state.project, gridCols, gridRows }
            })),

            setScale: (scale) => set({ scale }),

            toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

            selectItem: (currentMode, currentItemId) => set({ currentMode, currentItemId, selectedWidgetId: null }),

            selectWidget: (selectedWidgetId) => set({ selectedWidgetId }),

            setEditingWidgetId: (editingWidgetId) => set({ editingWidgetId }),

            addLayout: (id, name) => set((state) => ({
                project: {
                    ...state.project,
                    layouts: {
                        ...state.project.layouts,
                        [id]: { id, name, widgets: [] }
                    }
                },
                currentMode: 'layout',
                currentItemId: id
            })),

            addScreen: (id, name, layoutId = 'default') => set((state) => ({
                project: {
                    ...state.project,
                    screens: {
                        ...state.project.screens,
                        [id]: { id, name, layoutId, scrollType: 'fixed', widgets: [] }
                    }
                },
                currentMode: 'screen',
                currentItemId: id
            })),

            addWidget: (widget) => set((state) => {
                const { currentMode, currentItemId, project } = state;
                if (!currentItemId) return state;

                const newProject = { ...project };

                if (currentMode === 'layout') {
                    newProject.layouts[currentItemId].widgets.push(widget);
                } else {
                    newProject.screens[currentItemId].widgets.push(widget);
                }

                return { project: newProject, selectedWidgetId: widget.id };
            }),

            updateWidget: (id, updates) => set((state) => {
                const { currentMode, currentItemId, project } = state;
                if (!currentItemId) return state;

                const newProject = { ...project };
                let targetWidgets: Widget[] = [];

                // Find the widget source (either layout or screen)
                // NOTE: We only update widgets belonging to the CURRENT item. 
                // We cannot update inherited layout widgets from a screen view (as per requirement)
                if (currentMode === 'layout') {
                    targetWidgets = newProject.layouts[currentItemId].widgets;
                } else {
                    targetWidgets = newProject.screens[currentItemId].widgets;
                }

                const idx = targetWidgets.findIndex(w => w.id === id);
                if (idx !== -1) {
                    targetWidgets[idx] = { ...targetWidgets[idx], ...updates };
                }

                return { project: newProject };
            }),

            deleteWidget: (id) => set((state) => {
                const { currentMode, currentItemId, project } = state;
                if (!currentItemId) return state;

                const newProject = { ...project };

                if (currentMode === 'layout') {
                    newProject.layouts[currentItemId].widgets = newProject.layouts[currentItemId].widgets.filter(w => w.id !== id);
                } else {
                    newProject.screens[currentItemId].widgets = newProject.screens[currentItemId].widgets.filter(w => w.id !== id);
                }

                return { project: newProject, selectedWidgetId: null };
            }),

            duplicateWidget: (id) => set((state) => {
                const { currentMode, currentItemId, project } = state;
                if (!currentItemId) return state;

                const newProject = { ...project };
                const list = currentMode === 'layout'
                    ? newProject.layouts[currentItemId].widgets
                    : newProject.screens[currentItemId].widgets;

                const original = list.find(w => w.id === id);
                if (original) {
                    const newWidget = {
                        ...original,
                        id: crypto.randomUUID(),
                        name: original.name + ' (Copy)',
                        x: original.col, // Using col/row as base
                        y: original.row,
                        col: original.col + 1, // Offset slightly
                        row: original.row + 1
                    };
                    list.push(newWidget);
                    return { project: newProject, selectedWidgetId: newWidget.id };
                }
                return state;
            }),

            importJSON: (json, type) => set((state) => {
                // Implementation for full project import or partial import
                if (type === 'project') {
                    return { project: { ...DEFAULT_PROJECT, ...json }, currentItemId: null };
                }
                // Simplified for now
                return state;
            })
        }),
        {
            name: 'ui-placeholder-designer-storage'
        }
    )
);
