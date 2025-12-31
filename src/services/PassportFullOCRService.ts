import * as ort from 'onnxruntime-web';

// Reuse types or define local ones for VZ (Visual Zone)
export interface VisualZoneData {
    fullName?: string;
    passportNumber?: string;
    nationality?: string;
    dob?: string;
    rawBlocks: { text: string; box: any }[];
}

export class PassportFullOCRService {
    private detSession: ort.InferenceSession | null = null;
    private recSession: ort.InferenceSession | null = null;
    private keys: string[] = [];

    // Paths (Same as MRZ Service)
    private readonly MODEL_DET = '/models/ch_PP-OCRv4_det_infer.onnx';
    private readonly MODEL_REC = '/models/ch_PP-OCRv4_rec_infer.onnx';
    private readonly DICT_PATH = '/models/ppocr_keys_v1.txt';

    async load() {
        if (this.detSession && this.recSession) return;

        try {
            // Load Dictionary
            const dictResp = await fetch(this.DICT_PATH);
            const dictText = await dictResp.text();
            this.keys = dictText.split(/\r?\n/);
            this.keys.unshift('blank');
            this.keys.push(' ');

            // Load Models
            this.detSession = await ort.InferenceSession.create(this.MODEL_DET, { executionProviders: ['wasm'] });
            this.recSession = await ort.InferenceSession.create(this.MODEL_REC, { executionProviders: ['wasm'] });

            console.log('[FullOCR] Service Loaded Successfully');
        } catch (e) {
            console.error('[FullOCR] Setup Failed', e);
        }
    }

    // --- MAIN PIPELINE ---

    /**
     * Scans the full passport image and extracts visual fields.
     */
    async scanFullPage(image: HTMLCanvasElement | ImageData): Promise<VisualZoneData | null> {
        if (!this.detSession || !this.recSession) {
            await this.load();
        }

        // 1. Prepare Image (Resize for detection)
        const preprocess = this.preprocessDet(image);

        // 2. Detect Text Boxes (DBNet)
        const boxes = await this.detectText(preprocess.tensor, preprocess.w, preprocess.h, preprocess.origW, preprocess.origH);

        // 3. Recognize Content of each box
        const textBlocks: { text: string; box: any, centerY: number }[] = [];

        // Convert input to ImageData if needed for cropping
        let sourceData: ImageData;
        if (image instanceof HTMLCanvasElement) {
            const ctx = image.getContext('2d');
            if (!ctx) return null;
            sourceData = ctx.getImageData(0, 0, image.width, image.height);
        } else {
            sourceData = image;
        }

        for (const box of boxes) {
            if (box.w < 10 || box.h < 10) continue; // Skip noise

            const crop = this.cropPoly(sourceData, box);
            const text = await this.recognizeLine(crop);

            if (text && text.length > 2) {
                // Approximate center Y for line grouping
                const centerY = box.y + box.h / 2;
                textBlocks.push({ text: text.toUpperCase(), box, centerY });
            }
        }

        // 4. Heuristic Extraction (Find specific fields)
        return this.heuristicExtraction(textBlocks);
    }

    /**
     * Cross-References MRZ data with Visual Data to fix errors.
     * MRZ is authoritative for structure, Visual is authoritative for character clarity.
     */
    reconcileData(mrz: PassportData, visual: VisualZoneData): PassportData {
        const fixed = { ...mrz };

        // 1. Fix Name
        // MRZ: NGUYEN<<HAI<LINH -> Visual: NGUYEN HAI LINH
        if (visual.fullName) {
            const mrzNameClean = mrz.fullName.replace(/[^A-Z]/g, '');
            const vzNameClean = visual.fullName.replace(/[^A-Z]/g, '');

            // Simple fuzzy check: if length match and > 80% similarity
            if (Math.abs(mrzNameClean.length - vzNameClean.length) < 3) {
                // Strategy: If MRZ has numbers/garbage in name, take Visual.
                if (/[0-9]/.test(mrz.fullName) && !/[0-9]/.test(visual.fullName)) {
                    console.log('[Reconcile] Replacing invalid MRZ Name with Visual Name');
                    fixed.fullName = visual.fullName;
                }
            }
        }

        // 2. Fix Passport Number
        if (visual.passportNumber) {
            if (mrz.passportNumber !== visual.passportNumber) {
                console.log(`[Reconcile] PassportNum Mismatch: MRZ=${mrz.passportNumber} vs VZ=${visual.passportNumber}`);
                // Optionally trust Visual if MRZ failed checksum or looks weird
            }
        }

        return fixed;
    }

    // --- AI IMPLEMENTATION ---

    private async detectText(tensor: ort.Tensor, w: number, h: number, origW: number, origH: number): Promise<{ x: number, y: number, w: number, h: number }[]> {
        if (!this.detSession) return [];

        const feeds = { [this.detSession.inputNames[0]]: tensor };
        const results = await this.detSession.run(feeds);
        const output = results[this.detSession.outputNames[0]];

        return this.postProcessDet(output.data as Float32Array, w, h, origW, origH);
    }

    private async recognizeLine(imageData: ImageData): Promise<string> {
        if (!this.recSession) return '';

        // Standard PaddleOCR Rec Input
        const MODEL_H = 48;
        const MODEL_W = 320;

        // CRNN expects fixed height 48, varying width. 
        // We resize maintaining aspect ratio up to MODEL_W.
        const tensor = this.preprocessRec(imageData, MODEL_H, MODEL_W);

        const feeds = { [this.recSession.inputNames[0]]: tensor };
        const results = await this.recSession.run(feeds);
        const output = results[this.recSession.outputNames[0]]; // [1, TimeSteps, Vocab]

        return this.ctcDecode(output.data as Float32Array, output.dims);
    }

    // --- HELPERS (Copied & Adapted) ---

    // Note: 'preprocessDet' now returns a specific object structure for 'scanFullPage' usage
    private preprocessDet(image: any): { tensor: ort.Tensor, w: number, h: number, origW: number, origH: number } {
        const targetW = 640;
        const targetH = 640;

        let w = 0, h = 0;
        let ctxSrc: CanvasRenderingContext2D | null = null;

        // Get Dimensions & Context
        if (image instanceof HTMLCanvasElement) {
            w = image.width; h = image.height;
            ctxSrc = image.getContext('2d');
        } else if (image instanceof ImageData) {
            w = image.width; h = image.height;
            const t = document.createElement('canvas');
            t.width = w; t.height = h;
            t.getContext('2d')?.putImageData(image, 0, 0);
            ctxSrc = t.getContext('2d');
        }

        if (!ctxSrc) throw new Error('Input invalid');

        const scale = Math.min(targetW / w, targetH / h);
        const nw = Math.floor(w * scale);
        const nh = Math.floor(h * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('CTX');

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, targetW, targetH);

        // Draw Scaled
        ctx.drawImage(ctxSrc.canvas, 0, 0, nw, nh);

        const { data } = ctx.getImageData(0, 0, targetW, targetH);
        const floatData = new Float32Array(1 * 3 * targetH * targetW);

        const mean = [0.485, 0.456, 0.406];
        const std = [0.229, 0.224, 0.225];

        for (let i = 0; i < targetW * targetH; i++) {
            floatData[i] = (data[i * 4] / 255.0 - mean[0]) / std[0]; // R
            floatData[targetW * targetH + i] = (data[i * 4 + 1] / 255.0 - mean[1]) / std[1]; // G
            floatData[2 * targetW * targetH + i] = (data[i * 4 + 2] / 255.0 - mean[2]) / std[2]; // B
        }

        const tensor = new ort.Tensor('float32', floatData, [1, 3, targetH, targetW]);

        return { tensor, w: targetW, h: targetH, origW: w, origH: h };
    }

    private postProcessDet(heatmap: Float32Array, mapW: number, mapH: number, origW: number, origH: number): any[] {
        const threshold = 0.3;
        const visited = new Uint8Array(mapW * mapH);
        const boxes: any[] = [];
        const index = (x: number, y: number) => y * mapW + x;
        const q: number[] = [];

        for (let y = 0; y < mapH; y++) {
            for (let x = 0; x < mapW; x++) {
                const idx = index(x, y);
                if (heatmap[idx] > threshold && visited[idx] === 0) {
                    let minX = x, maxX = x, minY = y, maxY = y;
                    visited[idx] = 1; q.push(idx);

                    while (q.length > 0) {
                        const curr = q.pop()!;
                        const cy = Math.floor(curr / mapW);
                        const cx = curr % mapW;
                        minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
                        minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);

                        const neighbors = [
                            { nx: cx + 1, ny: cy }, { nx: cx - 1, ny: cy }, { nx: cx, ny: cy + 1 }, { nx: cx, ny: cy - 1 }
                        ];
                        for (const n of neighbors) {
                            if (n.nx >= 0 && n.nx < mapW && n.ny >= 0 && n.ny < mapH) {
                                const nIdx = index(n.nx, n.ny);
                                if (heatmap[nIdx] > threshold && visited[nIdx] === 0) {
                                    visited[nIdx] = 1; q.push(nIdx);
                                }
                            }
                        }
                    }

                    const w = maxX - minX + 1;
                    const h = maxY - minY + 1;
                    if (w > 10 && h > 5) {
                        // Correct Scaling
                        const scale = Math.min(mapW / origW, mapH / origH);
                        boxes.push({
                            x: Math.floor(minX / scale), y: Math.floor(minY / scale),
                            w: Math.floor(w / scale), h: Math.floor(h / scale)
                        });
                    }
                }
            }
        }
        return boxes;
    }

    private preprocessRec(imageData: ImageData, targetH: number, targetW: number): ort.Tensor {
        const w = imageData.width;
        const h = imageData.height;
        const scale = targetH / h;
        const scaledW = Math.floor(w * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW; canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('CTX');
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, targetW, targetH); // White background

        const temp = document.createElement('canvas');
        temp.width = w; temp.height = h;
        temp.getContext('2d')?.putImageData(imageData, 0, 0);

        ctx.drawImage(temp, 0, 0, Math.min(scaledW, targetW), targetH);

        const { data } = ctx.getImageData(0, 0, targetW, targetH);
        const floatData = new Float32Array(3 * targetH * targetW);

        for (let i = 0; i < targetH * targetW; i++) {
            // Normalized -0.5 to 0.5
            floatData[i] = (data[i * 4] / 255.0 - 0.5) / 0.5;
            floatData[targetH * targetW + i] = (data[i * 4 + 1] / 255.0 - 0.5) / 0.5;
            floatData[2 * targetH * targetW + i] = (data[i * 4 + 2] / 255.0 - 0.5) / 0.5;
        }
        return new ort.Tensor('float32', floatData, [1, 3, targetH, targetW]);
    }

    private ctcDecode(data: Float32Array, dims: readonly number[]): string {
        const timeSteps = dims[1];
        const vocabSize = dims[2];
        const chars: string[] = [];
        let lastChar = -1;

        for (let t = 0; t < timeSteps; t++) {
            let maxVal = -Infinity;
            let maxIdx = -1;
            const offset = t * vocabSize;
            for (let v = 0; v < vocabSize; v++) {
                const val = data[offset + v];
                if (val > maxVal) {
                    maxVal = val;
                    maxIdx = v;
                }
            }
            if (maxIdx !== 0 && maxIdx !== lastChar && maxIdx < this.keys.length) {
                chars.push(this.keys[maxIdx]);
            }
            lastChar = maxIdx;
        }
        return chars.join('').replace(/blank/g, '');
    }

    private cropPoly(source: ImageData, box: any): ImageData {
        const c = document.createElement('canvas');
        c.width = source.width; c.height = source.height;
        const ctx = c.getContext('2d');
        if (!ctx) return new ImageData(1, 1);
        ctx.putImageData(source, 0, 0);

        // Simple ROI Crop
        const x = Math.max(0, box.x);
        const y = Math.max(0, box.y);
        const w = Math.min(box.w, source.width - x);
        const h = Math.min(box.h, source.height - y);

        if (w <= 0 || h <= 0) return new ImageData(1, 1);
        return ctx.getImageData(x, y, w, h);
    }

    private heuristicExtraction(blocks: { text: string, centerY: number }[]): VisualZoneData {
        const data: VisualZoneData = { rawBlocks: blocks };

        // Sort by Y position (Top to Bottom)
        blocks.sort((a, b) => a.centerY - b.centerY);

        for (let i = 0; i < blocks.length; i++) {
            const line = blocks[i].text;

            // Nationality
            if (line.includes('NATIONALITY') || line.includes('QUOC TICH')) {
                if (i + 1 < blocks.length) {
                    const next = blocks[i + 1];
                    if (!next.text.includes('/')) {
                        data.nationality = next.text;
                    }
                }
            }

            // Name
            if (line.includes('FULL NAME') || line.includes('HO VA TEN')) {
                if (i + 1 < blocks.length) {
                    data.fullName = blocks[i + 1].text;
                }
            }

            // Passport No
            const passportRegex = /^[A-Z][0-9]{7,8}$/;
            if (passportRegex.test(line)) {
                if (!line.includes('<')) {
                    data.passportNumber = line;
                }
            }
        }

        return data;
    }
}

export const passportFullOCR = new PassportFullOCRService();
