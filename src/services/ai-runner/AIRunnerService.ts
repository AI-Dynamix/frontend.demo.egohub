import type { ScanDebugData, PassportData } from '../PassportTypes';

interface WorkerResponse {
    type: 'LOAD_SUCCESS' | 'LOAD_ERROR' | 'SCAN_SUCCESS' | 'SCAN_ERROR' | 'LOG';
    payload?: any;
    id: string;
}

interface ScanResult {
    debug: ScanDebugData;
    data: PassportData | null;
}

class AIRunnerService {
    private worker: Worker | null = null;
    private isReady = false;
    private loadPromise: Promise<void> | null = null;
    private pendingRequests = new Map<string, { resolve: Function, reject: Function }>();

    constructor() {
        // Lazy init in load()
    }

    public async load() {
        if (this.isReady) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = (async () => {
            console.log('[AIRunner] Spawning Worker...');

            // Vite worker import syntax
            this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), {
                type: 'module'
            });

            this.worker.onmessage = this.handleMessage.bind(this);
            this.worker.onerror = (e) => console.error('[AIRunner] Worker Error:', e);

            // Wait for load
            try {
                await this.post("LOAD", {});
                this.isReady = true;
                console.log('[AIRunner] Service Ready');
            } catch (e) {
                console.error('[AIRunner] Load Failed', e);
                this.worker = null;
                this.loadPromise = null;
                throw e;
            }
        })();

        return this.loadPromise;
    }

    private handleMessage(e: MessageEvent<WorkerResponse>) {
        const { type, payload, id } = e.data;

        if (type === 'LOG') {
            console.log(`[Worker] ${payload}`);
            return;
        }

        const request = this.pendingRequests.get(id);
        if (request) {
            if (type.endsWith('_SUCCESS')) {
                request.resolve(payload);
            } else {
                request.reject(new Error(payload));
            }
            this.pendingRequests.delete(id);
        }
    }

    private post<T>(type: string, payload: any, transfer: Transferable[] = []): Promise<T> {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);
            this.pendingRequests.set(id, { resolve, reject });
            this.worker?.postMessage({ type, payload, id }, transfer);
        });
    }

    public async scanPassport(
        imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
    ): Promise<ScanResult> {
        if (!this.isReady) {
            console.warn('[AIRunner] Worker not ready, initializing...');
            await this.load();
        }

        // Prepare ImageBitmap to transfer ownership (Zero-Copy-ish)
        let bitmap: ImageBitmap;

        // Note: createImageBitmap usage
        if (imageSource instanceof HTMLVideoElement) {
            const w = imageSource.videoWidth;
            const h = imageSource.videoHeight;
            bitmap = await createImageBitmap(imageSource);
            // We pass w/h explicitly because sometimes bitmap size might vary or just for convenience
            return this.post<ScanResult>('SCAN_PASSPORT', { image: bitmap, width: w, height: h }, [bitmap]);
        } else if (imageSource instanceof HTMLCanvasElement) {
            bitmap = await createImageBitmap(imageSource);
            return this.post<ScanResult>('SCAN_PASSPORT', { image: bitmap, width: imageSource.width, height: imageSource.height }, [bitmap]);
        } else {
            // Image
            bitmap = await createImageBitmap(imageSource);
            return this.post<ScanResult>('SCAN_PASSPORT', { image: bitmap, width: imageSource.naturalWidth, height: imageSource.naturalHeight }, [bitmap]);
        }
    }

    public terminate() {
        this.worker?.terminate();
        this.worker = null;
        this.isReady = false;
        this.loadPromise = null;
        this.pendingRequests.clear();
    }
}

export const aiRunner = new AIRunnerService();
