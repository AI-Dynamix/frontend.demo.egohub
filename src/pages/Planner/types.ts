export type DeviceType = 'phone' | 'iphone-14' | 'pixel-7' | 'kiosk' | 'ipad' | 'custom';
export type ScrollType = 'fixed' | 'scrollable';
export type Mode = 'screen' | 'layout';

export interface Widget {
    id: string;
    name: string;
    type: string; // "Header", "Footer", etc.
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
    rowSpan: number;
    color?: string;
    componentId?: string;
}

export interface Layout {
    id: string;
    name: string;
    widgets: Widget[];
}

export interface Screen {
    id: string;
    name: string;
    layoutId: string; // Reference to a layout (can be "none" or empty)
    scrollType: ScrollType;
    widgets: Widget[];
}

export interface ProjectData {
    name: string;
    version: string;
    gridCols: number;
    gridRows: number;
    device: DeviceType;
    layouts: Record<string, Layout>; // Map by ID
    screens: Record<string, Screen>; // Map by ID
    exportedAt?: string;
}

export interface PlannerState {
    project: ProjectData;
    currentMode: Mode;
    currentItemId: string | null; // active screenId or layoutId
    selectedWidgetId: string | null;
    showGrid: boolean;
    scale: number; // For canvas zoom/fit
}
