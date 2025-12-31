import * as ort from 'onnxruntime-web';
import { parse } from 'mrz';

// Configure ONNX Runtime to use local WASM files for offline support
// Use absolute URL to avoid ambiguous relative path issues in Vite
ort.env.wasm.wasmPaths = typeof window !== 'undefined' ? window.location.origin + '/wasm/' : '/wasm/';
// Disable multi-threading and proxy to avoid loading .mjs files (Vite dev server issue) and COOP/COEP header requirements
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

interface OCRResult {
    text: string;
    confidence: number;
    box: number[][]; // [x,y] coordinates
}

import type { ScanDebugData, PassportData } from './PassportTypes';

const DET_MODEL_PATH = '/models/ocr/det.onnx';
const REC_MODEL_PATH = '/models/ocr/rec.onnx';
const DICT_PATH = '/models/ocr/keys.txt';

class PassportOCRService {
    private detSession: ort.InferenceSession | null = null;
    private recSession: ort.InferenceSession | null = null;
    private keys: string[] = [];
    private isLoaded: boolean = false;
    private isLoading: boolean = false;

    constructor() { }

    public async load() {
        if (this.isLoaded) {
            console.log('[PassportOCR] Service is already loaded.');
            return;
        }
        if (this.isLoading) {
            console.log('[PassportOCR] Service loading is already in progress...');
            return;
        }

        this.isLoading = true;

        try {
            console.group('[PassportOCR] Initializing...');
            console.log('Loading Dictionary:', DICT_PATH);
            const response = await fetch(DICT_PATH);
            if (!response.ok) throw new Error(`Dictionary request failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            this.keys = text.split('\n');
            this.keys.unshift('blank'); // CTC blank
            this.keys.push(' ');
            console.log(`Dictionary loaded (${this.keys.length} keys)`);

            console.log('Loading ONNX Models...');
            // Load ONNX Models
            const [det, rec] = await Promise.all([
                ort.InferenceSession.create(DET_MODEL_PATH, { executionProviders: ['wasm'] }),
                ort.InferenceSession.create(REC_MODEL_PATH, { executionProviders: ['wasm'] })
            ]);

            this.detSession = det;
            this.recSession = rec;
            this.isLoaded = true;
            console.log('ONNX Sessions created successfully.');
            console.log('✅ AI Service READY');
        } catch (error) {
            console.error('❌ Critical Error - Failed to load models:', error);
            // Allow retry by resetting isLoading
        } finally {
            console.groupEnd();
            this.isLoading = false;
        }
    }

    public async scanPassport(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<{ debug: ScanDebugData, data: PassportData | null }> {
        const debug: ScanDebugData = {};

        if (!this.isLoaded || !this.recSession) {
            console.warn('[PassportOCR] Service not ready (RecSession missing)');
            return { debug, data: null };
        }

        try {
            // Determine dimensions based on element type
            let w = 0, h = 0;
            if (imageElement instanceof HTMLVideoElement) {
                w = imageElement.videoWidth;
                h = imageElement.videoHeight;
            } else if (imageElement instanceof HTMLImageElement) {
                w = imageElement.naturalWidth;
                h = imageElement.naturalHeight;
            } else if (imageElement instanceof HTMLCanvasElement) {
                w = imageElement.width;
                h = imageElement.height;
            }

            if (!w || !h || w === 0 || h === 0) return { debug, data: null };

            // Capture Raw Frame for Debug
            const fullCanvas = document.createElement('canvas');
            fullCanvas.width = w;
            fullCanvas.height = h;
            const fullCtx = fullCanvas.getContext('2d');
            if (fullCtx) {
                fullCtx.drawImage(imageElement, 0, 0);
                debug.rawImage = fullCanvas.toDataURL('image/jpeg', 0.5); // Quality 0.5
            }

            const mrzCanvas = document.createElement('canvas');
            const ctx = mrzCanvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return { debug, data: null };

            // ... (Crop logic)

            // Adjust Crop to match new UI:
            // Height: 20% of frame (0.20)
            // Width: 90% of frame (0.90) - Centered (Widened from 75%)
            // Start Y: Center (50%) + Offset (20%) = 70%. Half-Height 10%. Start = 60%.

            const cropH = Math.floor(h * 0.20);
            const cropY = Math.floor(h * 0.60);
            const cropW = Math.floor(w * 0.90);
            const cropX = Math.floor((w - cropW) / 2);

            if (cropH <= 0 || cropW <= 0) return { debug, data: null };

            mrzCanvas.width = cropW;
            mrzCanvas.height = cropH;
            ctx.drawImage(imageElement, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            // Get Debug Image
            debug.cropImage = mrzCanvas.toDataURL('image/jpeg', 0.8);


            // 2. Logic: Process Cropped Region (Preprocessing Pipeline)
            // Pipeline: Crop -> Grayscale -> Gaussian Blur -> Adaptive Threshold -> Deskew -> Smart Split

            // 2. Logic: Process Cropped Region (Preprocessing Pipeline)
            // Pipeline: Crop -> Scale Up -> Grayscale -> Gaussian Blur -> Adaptive Threshold -> Deskew -> Detect

            let cropData = ctx.getImageData(0, 0, cropW, cropH);

            // Upscale 2x
            cropData = this.upscale(cropData, 2.0);

            // 2.0. Enhance Contrast (Normalize Brightness)
            // Helps if image is hazy or low contrast (common in video frames)
            cropData = this.normalizeBrightness(cropData);

            // 2a. Grayscale
            cropData = this.toGrayscale(cropData);

            // 2b. Gaussian Blur (Noise Reduction)
            cropData = this.gaussianBlur(cropData);

            // 2c. Adaptive Threshold (Binarization - fixes shadows)
            // Note: OCR models sometimes prefer grayscale, but if shadows are bad, binary is safer for detection/splitting.
            // Let's try passing Binary to the model too, or we can keep a Grayscale copy?
            // User requested Adaptive Threshold specifically to clear noise.
            cropData = this.adaptiveThreshold(cropData);

            // 2d. Clean Borders (Remove fingers/dark edges)
            cropData = this.cleanBorders(cropData);

            // 2d-2. Erosion (Thinning text to reduce smudge)
            cropData = this.erode(cropData);

            // 2e. Deskew (Correct rotation on Binary image is very accurate)
            cropData = this.deskew(cropData);

            // Update Debug View with Preprocessed Image
            const processedCanvas = document.createElement('canvas');
            processedCanvas.width = cropData.width;
            processedCanvas.height = cropData.height;
            processedCanvas.getContext('2d')?.putImageData(cropData, 0, 0);
            debug.cropImage = processedCanvas.toDataURL('image/png'); // PNG for crisp binary

            // 3. AI Text Detection (DBNet)
            // Use the Deskewed/Cleaned Binary Image (or Grayscale?)
            // DBNet is robust, but let's try with the clean image first.
            const boxes = await this.detectText(cropData);

            // Sort boxes: Line 1 (Top), Line 2 (Bottom)
            // MRZ always has 2 lines. We pick the top 2 largest/widest?
            // Usually sorting by Y is enough.
            boxes.sort((a, b) => a.y - b.y);

            const linesText: string[] = [];

            // We expect 2 lines.
            debug.line1Image = '';
            debug.line2Image = '';

            for (let i = 0; i < Math.min(boxes.length, 2); i++) {
                const box = boxes[i];
                // Crop the box
                let lineImg = this.cropBox(cropData, box);

                // Enhance: Sharpen, Binarize, Connect
                lineImg = this.enhanceLine(lineImg);

                const base64 = this.imageDataToBase64(lineImg);
                const sizeStr = `${lineImg.width}x${lineImg.height}`;

                if (i === 0) {
                    debug.line1Image = base64;
                    debug.line1Size = sizeStr;
                }
                if (i === 1) {
                    debug.line2Image = base64;
                    debug.line2Size = sizeStr;
                }

                const text = await this.recognizeLine(lineImg);
                linesText.push(text);
            }

            if (linesText.length > 0) debug.line1FromModel = linesText[0];
            if (linesText.length > 1) debug.line2FromModel = linesText[1];

            console.log('[PassportOCR] Lines:', linesText);

            // Validation & Correction
            const processResult = this.processMRZ(linesText);

            if (processResult.error) {
                debug.validationError = processResult.error;
            }

            return { debug, data: processResult.data };

        } catch (e) {
            console.error('[PassportOCR] Scan error:', e);
            return { debug, data: null };
        }
    }

    private imageDataToBase64(img: ImageData): string {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d')?.putImageData(img, 0, 0);
        return c.toDataURL('image/png');
    }

    private cropBox(source: ImageData, box: { x: number, y: number, w: number, h: number }): ImageData {
        const c = document.createElement('canvas');
        c.width = source.width;
        c.height = source.height;
        const ctx = c.getContext('2d');
        if (!ctx) return new ImageData(1, 1);
        ctx.putImageData(source, 0, 0);

        // Expand Strategy:
        // Width: Increase by 10% (5% each side)
        // Height: Fixed padding (13px)

        const expandRatio = 0.10; // 10%
        const extraW = Math.floor(box.w * expandRatio);
        const padX = Math.floor(extraW / 2);

        // Split Vertical Padding: Bias towards TOP
        const padTop = 30;    // Increased significantly for top ascenders
        const padBottom = 15;

        // Update Box Coords
        const sx = Math.max(0, box.x - padX);
        const sy = Math.max(0, box.y - padTop);

        // Width is Box + Extra (10%) + maybe existing fixed X? 
        // User said "Reduce fixed X" implied? Let's stick to percentage.
        // Actually, let's add a small safety fixed pixel just in case 5% is tiny (e.g. short text).
        // box.w + the calculated Extra Padding (padX * 2).

        const sw = Math.min(source.width - sx, box.w + padX * 2);
        const sh = Math.min(source.height - sy, box.h + padTop + padBottom);

        if (sw <= 0 || sh <= 0) return new ImageData(1, 1);

        let cropData = ctx.getImageData(sx, sy, sw, sh);

        // EXTRA: Fine-tune rotation for this specific line
        cropData = this.deskew(cropData);

        return cropData;
    }

    // --- DETECTION (DBNet) ---

    private async detectText(imageData: ImageData): Promise<{ x: number, y: number, w: number, h: number }[]> {
        if (!this.detSession) return [];

        const DET_SIZE = 640; // Standard for DBNet

        // 1. Preprocess
        const tensor = this.preprocessDet(imageData, DET_SIZE, DET_SIZE);

        // 2. Run
        const feeds = { [this.detSession.inputNames[0]]: tensor };
        const results = await this.detSession.run(feeds);
        const output = results[this.detSession.outputNames[0]]; // [1, 1, 640, 640] usually

        // 3. Post-process (Heatmap -> Boxes)
        return this.postProcessDet(output.data as Float32Array, DET_SIZE, DET_SIZE, imageData.width, imageData.height);
    }

    private preprocessDet(imageData: ImageData, targetW: number, targetH: number): ort.Tensor {
        // Resize with padding to keep aspect ratio
        const w = imageData.width;
        const h = imageData.height;
        const scale = Math.min(targetW / w, targetH / h);
        const nw = Math.floor(w * scale);
        const nh = Math.floor(h * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('CTX');

        // Fill black? or gray? Standard is usually mean-subtracted.
        // Let's fill 0 (black).
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, targetW, targetH);

        // Draw image centered or top-left? Top-left is safer for mapping.
        // Use temp canvas
        const temp = document.createElement('canvas');
        temp.width = w;
        temp.height = h;
        temp.getContext('2d')?.putImageData(imageData, 0, 0);

        ctx.drawImage(temp, 0, 0, nw, nh);

        const result = ctx.getImageData(0, 0, targetW, targetH);
        const data = result.data;
        const floatData = new Float32Array(1 * 3 * targetH * targetW);

        // Normalize (Standard ImageNet mean/std usually, or 0-1)
        // DBNet: (x - mean) / std. 
        // Mean: [0.485, 0.456, 0.406], Std: [0.229, 0.224, 0.225] * 255?
        // Let's use simple scaling -0.5 to 0.5 for now or check pytorch standard.
        // Usually: pixel / 255.0. Then (p - 0.485) / 0.229...

        const mean = [0.485, 0.456, 0.406];
        const std = [0.229, 0.224, 0.225];

        for (let i = 0; i < targetW * targetH; i++) {
            const r = data[i * 4] / 255.0;
            const g = data[i * 4 + 1] / 255.0;
            const b = data[i * 4 + 2] / 255.0;

            floatData[i] = (r - mean[0]) / std[0]; // R
            floatData[targetW * targetH + i] = (g - mean[1]) / std[1]; // G
            floatData[2 * targetW * targetH + i] = (b - mean[2]) / std[2]; // B
        }

        return new ort.Tensor('float32', floatData, [1, 3, targetH, targetW]);
    }

    private postProcessDet(heatmap: Float32Array, mapW: number, mapH: number, origW: number, origH: number): { x: number, y: number, w: number, h: number }[] {
        // Simple Connected Components
        const threshold = 0.3;
        const visited = new Uint8Array(mapW * mapH);
        const boxes: { x: number, y: number, w: number, h: number }[] = [];

        const index = (x: number, y: number) => y * mapW + x;

        // BFS Helper
        const q: number[] = []; // queue of indices

        for (let y = 0; y < mapH; y++) {
            for (let x = 0; x < mapW; x++) {
                const idx = index(x, y);
                if (heatmap[idx] > threshold && visited[idx] === 0) {
                    // Start BFS
                    let minX = x, maxX = x, minY = y, maxY = y;
                    visited[idx] = 1;
                    q.push(idx);

                    while (q.length > 0) {
                        const curr = q.pop()!;
                        const cy = Math.floor(curr / mapW);
                        const cx = curr % mapW;

                        if (cx < minX) minX = cx;
                        if (cx > maxX) maxX = cx;
                        if (cy < minY) minY = cy;
                        if (cy > maxY) maxY = cy;

                        // Neighbors (4-conn)
                        const neighbors = [
                            { nx: cx + 1, ny: cy },
                            { nx: cx - 1, ny: cy },
                            { nx: cx, ny: cy + 1 },
                            { nx: cx, ny: cy - 1 }
                        ];

                        for (const n of neighbors) {
                            if (n.nx >= 0 && n.nx < mapW && n.ny >= 0 && n.ny < mapH) {
                                const nIdx = index(n.nx, n.ny);
                                if (heatmap[nIdx] > threshold && visited[nIdx] === 0) {
                                    visited[nIdx] = 1;
                                    q.push(nIdx);
                                }
                            }
                        }
                    }

                    // Found Blob. Check size.
                    const w = maxX - minX + 1;
                    const h = maxY - minY + 1;

                    if (w > 10 && h > 5) { // Filter noise
                        // Map back to Original Coordinates
                        const scale = Math.max(origW / mapW, origH / mapH); // Since we scaled by min ratio
                        // Actually we calculated: scale = min(640/w, 640/h). 
                        // So box * (1/scale)
                        // Be careful with the 'preprocessDet' scaling logic.
                        // preprocessDet: nw = w * scale. So x_map = x_orig * scale.
                        // x_orig = x_map / scale.

                        const actualScale = Math.min(mapW / origW, mapH / origH); // The scale factor used

                        boxes.push({
                            x: Math.floor(minX / actualScale),
                            y: Math.floor(minY / actualScale),
                            w: Math.floor(w / actualScale),
                            h: Math.floor(h / actualScale)
                        });
                    }
                }
            }
        }
        return boxes;
    }

    private async recognizeLine(imageData: ImageData): Promise<string> {
        if (!this.recSession) return '';

        // 1. Resize & Normalize for Rec Model (C, H, W) -> (3, 48, 320) usually
        // PaddleOCR Rec Input: [1, 3, 48, W] (Dynamic Width supported by some models, but let's fix to 320 for stability or calc ratio)
        // Standard shape: [1, 3, 48, 320]

        // MRZ is FAST/LONG (44 chars). 320px / 44 = 7px/char width. TOO SMALL.
        // We need 10-15px width per char min. 44 * 15 = 660.
        // Let's use 800 to be safe.
        const MODEL_H = 48;
        const MODEL_W = 800; // Increased from 320 to improve resolution per char

        const tensor = this.preprocessRec(imageData, MODEL_H, MODEL_W);

        // 2. Run Inference
        const feeds = { [this.recSession.inputNames[0]]: tensor };
        const results = await this.recSession.run(feeds);
        const output = results[this.recSession.outputNames[0]]; // Float32Array [1, SequenceLength, VocabSize]

        // 3. CTC Decode
        return this.ctcDecode(output.data as Float32Array, output.dims);
    }

    private preprocessRec(imageData: ImageData, targetH: number, targetW: number): ort.Tensor {
        // Resize logic protecting aspect ratio
        // PaddleOCR Rec usually expects: Height fixed to 48 (or 32). Width dynamic or fixed 320.
        // We will resize Height to targetH (48). Scale Width accordingly.
        // Then pad to targetW (320) with WHITE (background).

        const originalW = imageData.width;
        const originalH = imageData.height;

        const scale = targetH / originalH;
        const scaledW = Math.floor(originalW * scale);

        // 1. Create Canvas with Target Size (320x48)
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No context');

        // Fill with WHITE (assuming MRZ is white background roughly)
        // Actually, normalizing 0.5/0.5 means gray is 0.
        // Let's safe-guard by padding with the average color of the image or just White.
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);

        // 2. Draw Resized Image (Left Aligned due to sequence reading)
        // We need a temp canvas to resize first?
        // ctx.drawImage(source, dx, dy, dWidth, dHeight) does scaling.

        // Convert ImageData to Bitmap/Canvas source
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalW;
        tempCanvas.height = originalH;
        tempCanvas.getContext('2d')?.putImageData(imageData, 0, 0);

        // Draw scaled
        // Cap width at targetW if too long
        const drawW = Math.min(scaledW, targetW);
        ctx.drawImage(tempCanvas, 0, 0, drawW, targetH);

        // 3. Get Data & Normalize
        const finalData = ctx.getImageData(0, 0, targetW, targetH);

        // View the input for debug?
        // document.body.appendChild(canvas); // DEBUG Only

        const float32Data = new Float32Array(3 * targetH * targetW);
        const { data } = finalData; // RGBA

        for (let i = 0; i < targetH * targetW; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];

            // HWC -> CHW
            // R
            float32Data[i] = (r / 255.0 - 0.5) / 0.5;
            // G
            float32Data[targetH * targetW + i] = (g / 255.0 - 0.5) / 0.5;
            // B
            float32Data[2 * targetH * targetW + i] = (b / 255.0 - 0.5) / 0.5;
        }

        return new ort.Tensor('float32', float32Data, [1, 3, targetH, targetW]);
    }

    private ctcDecode(data: Float32Array, dims: readonly number[]): string {
        // dims: [Batch, Time, Vocab]
        // Assuming Batch=1
        const timeSteps = dims[1];
        const vocabSize = dims[2];

        const chars: string[] = [];
        let lastChar = -1;

        // MRZ Allowed Chars: 0-9, A-Z, <
        const allowedSet = new Set<string>('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<'.split(''));

        // Extended Mapping for recovery
        const charMap: Record<string, string> = {
            '|': 'I',
            '!': 'I',
            '[': 'I',
            ']': 'I',
            '(': 'C',
            ')': 'C',
            '{': 'I',
            '}': 'I',
            'l': 'L',
            'i': 'I',
            'z': 'Z',
            'o': 'O',
            'b': '8',
            's': '5',
            'g': '6',
            'q': '0',
            // Add more lowercase as needed
        };

        // ArgMax for each time step - WITH WHITELISTING & REMAPPING
        for (let t = 0; t < timeSteps; t++) {
            let maxVal = -Infinity;
            let maxIdx = -1;

            const offset = t * vocabSize;
            for (let v = 0; v < vocabSize; v++) {
                const val = data[offset + v];

                if (v === 0) {
                    // Always allow blank
                    if (val > maxVal) { maxVal = val; maxIdx = v; }
                } else if (v < this.keys.length) {
                    let char = this.keys[v];

                    // Check direct allowance OR mapped allowance
                    const mapped = charMap[char] || char.toUpperCase();

                    if (allowedSet.has(mapped)) {
                        if (val > maxVal) { maxVal = val; maxIdx = v; }
                    }
                }
            }

            // CTC Logic: Ignore blanks (0 usually) and duplicates
            if (maxIdx !== 0 && maxIdx !== lastChar) {
                // Map index to char
                if (maxIdx > 0 && maxIdx < this.keys.length) {
                    let rawChar = this.keys[maxIdx];
                    // Apply recovery map
                    if (charMap[rawChar]) rawChar = charMap[rawChar];
                    else rawChar = rawChar.toUpperCase();

                    chars.push(rawChar);
                }
            }
            lastChar = maxIdx;
        }

        return chars.join('');
    }

    // ----------- ALIAS & CHECKSUM LOGIC -----------

    private processMRZ(lines: string[]): { data: PassportData | null, error?: string } {
        // Clean lines (keep only A-Z 0-9 <)
        const cleanLines = lines.map(l => l.toUpperCase().replace(/[^A-Z0-9<]/g, ''));

        // Try to identify the 2 MRZ lines (Length check ~44)
        // Heuristic: Line 2 usually starts with ID/Passport char + number
        // Line 1 starts with P, V, I etc.

        // For simple robust check: pass to 'mrz' parse.
        // But first, apply heuristics to fix 0/O

        const correctedLines = this.heuristicCorrection(cleanLines);

        if (correctedLines.length < 2) return { data: null, error: 'Incomplete Scan (Need 2 Lines)' };

        // STRICT VALIDATION TO PREVENT FALSE POSITIVES
        const [l1, l2] = correctedLines;

        // 1. Check Start Char of Line 1 (P=Passport, V=Visa, I=ID, A/C=Old)
        if (!/^[PVIAC]/.test(l1)) {
            console.log('[MRZ] Rejected: Line 1 invalid start char', l1[0]);
            return { data: null, error: 'Invalid MRZ Line 1 Start' };
        }

        // 2. Line 2 Digit Density Check
        // MRZ Line 2 contains Doc Number, DOB, Expiry -> lots of digits.
        // If < 10 digits, it's likely noise or wrong crop.
        const digitCount = (l2.match(/\d/g) || []).length;
        if (digitCount < 10) {
            console.log('[MRZ] Rejected: Line 2 insufficient digits', digitCount);
            return { data: null, error: 'Line 2 Missing Digits' };
        }

        // Try parsing
        try {
            const result = parse(correctedLines);
            if (!result.valid) {
                // MRZ Checksum failed. Treat as scan failure.
                console.group('[MRZ] Validation Failed');
                console.log('Raw Lines:', correctedLines);

                const errors: string[] = [];
                if (result.details) {
                    result.details.forEach((detail: any) => {
                        if (!detail.valid) {
                            const msg = detail.message || 'Checksum mismatch';
                            console.log('Error Field ' + detail.field + ': ' + msg);
                            errors.push(detail.field);
                        }
                    });
                }
                console.groupEnd();

                return {
                    data: null,
                    error: `Checksum Failed: ${errors.join(', ')} `
                };
            }

            return {
                data: {
                    fullName: `${result.fields.firstName} ${result.fields.lastName} `,
                    passportNumber: result.fields.documentNumber || '',
                    nationality: result.fields.nationality || '',
                    dob: result.fields.birthDate || '',
                    gender: result.fields.sex || '',
                    expiryDate: result.fields.expirationDate || '',
                    issuingCountry: result.fields.issuingState || '',
                    mrzRaw: correctedLines.join('\n')
                }
            };
        } catch (e: any) {
            console.warn('[MRZ] Parsing failed', e);
            return { data: null, error: `MRZ Parse Exception: ${e.message} ` };
        }
    }

    private heuristicCorrection(lines: string[]): string[] {
        // Expecting 2 lines of 44 chars (TD3)
        // If lines contain "garbage" or short lines, filter them.
        const candidates = lines.filter(l => l.length > 30);
        if (candidates.length < 2) return candidates;

        let line1 = candidates[0]; // P<VNM...
        let line2 = candidates[1]; // DocNum...

        // --- LINE 1 CORRECTION (ALPHA ONLY) ---
        // User Requirement: Line 1 has NO numbers. Fix specific OCR confusion.
        // 1 -> I
        // 0 -> O
        // 2 -> Z
        // 5 -> S
        // 8 -> B
        const fixLine1 = (str: string) => {
            return str
                .replace(/1/g, 'I')
                .replace(/0/g, 'O')
                .replace(/2/g, 'Z')
                .replace(/5/g, 'S')
                .replace(/8/g, 'B')
                .replace(/4/g, 'A') // A sometimes 4
                .replace(/6/g, 'G')
                .replace(/7/g, 'T'); // Heuristic
        };
        line1 = fixLine1(line1);


        // --- LINE 2 CORRECTION (DIGITS HEAVY) ---
        // Line 2: First 9 chars are Document Number -> Should be mostly Digits (except some countries use alphanum).
        // BUT 0 vs O is common error.
        // Positions 13-18 (YYMMDD) -> Digits.
        // Positions 21-27 (YYMMDD) -> Digits.

        // Positions 21-27 (YYMMDD) -> Digits.

        let l2 = line2.split('');

        // Helper: Force Digit
        const forceDigit = (idx: number) => {
            if (idx >= l2.length) return;
            if (l2[idx] === 'O') l2[idx] = '0';
            if (l2[idx] === 'I') l2[idx] = '1'; // sometimes I becomes 1 in OCR
            if (l2[idx] === 'B') l2[idx] = '8'; // common OCR error
            if (l2[idx] === 'S') l2[idx] = '5';
            if (l2[idx] === 'Z') l2[idx] = '2';
        };

        // Helper: Force Char
        const forceChar = (idx: number) => {
            if (idx >= l2.length) return;
            // Logic not strictly implemented for Line 1 Name yet as it's complex
        };

        // Date of Birth (Pos 13-18: 6 digits)
        for (let i = 13; i < 19; i++) forceDigit(i);

        // Expiry (Pos 21-26: 6 digits)
        for (let i = 21; i < 27; i++) forceDigit(i);

        // Don't modify check digits blindly, but DOB/EXP dates are strictly digits.

        return [line1, l2.join('')];
    }

    private smartLineSplit(imageData: ImageData): { line1: ImageData, line2: ImageData, line1Base64: string, line2Base64: string } {
        const w = imageData.width;
        const h = imageData.height;
        const data = imageData.data;

        // 1. Calculate Horizontal Projection (Average Row Luma)
        // We look for the "Brightest" row in the middle to be the gap.
        const rowAvgLuma = new Float32Array(h);

        for (let y = 0; y < h; y++) {
            let sum = 0;
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                // Luma
                sum += (0.299 * r + 0.587 * g + 0.114 * b);
            }
            rowAvgLuma[y] = sum / w;
        }

        // 2. Find Split Point (Peak Brightness in middle)
        const searchStart = Math.floor(h * 0.35);
        const searchEnd = Math.floor(h * 0.65);

        let maxLuma = -1;
        let splitY = Math.floor(h / 2);

        for (let y = searchStart; y < searchEnd; y++) {
            if (rowAvgLuma[y] > maxLuma) {
                maxLuma = rowAvgLuma[y];
                splitY = y;
            }
        }

        // 3. Extract Images
        const crop = (yStart: number, yEnd: number): ImageData => {
            const newH = yEnd - yStart;
            if (newH <= 0) return new ImageData(1, 1);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = newH;
            const ctx = canvas.getContext('2d');
            if (!ctx) return new ImageData(1, 1);

            const tempC = document.createElement('canvas');
            tempC.width = w;
            tempC.height = h;
            tempC.getContext('2d')?.putImageData(imageData, 0, 0); // Use processed input

            ctx.drawImage(tempC, 0, yStart, w, newH, 0, 0, w, newH);
            return ctx.getImageData(0, 0, w, newH);
        };

        // Create visuals for debug
        const toBase64 = (imgData: ImageData) => {
            const c = document.createElement('canvas');
            c.width = imgData.width;
            c.height = imgData.height;
            c.getContext('2d')?.putImageData(imgData, 0, 0);
            return c.toDataURL('image/png');
        };

        let l1Img = crop(0, splitY);
        let l2Img = crop(splitY, h);

        // Apply Dense Crop (Tight fitting)
        l1Img = this.denseCrop(l1Img);
        l2Img = this.denseCrop(l2Img);

        return {
            line1: l1Img,
            line2: l2Img,
            line1Base64: toBase64(l1Img), // Helper return
            line2Base64: toBase64(l2Img)
        };
    }

    private contrastStretch(imageData: ImageData): ImageData {
        const data = imageData.data;
        const w = imageData.width;
        const h = imageData.height;

        // Find min/max luma
        let min = 255;
        let max = 0;

        for (let i = 0; i < data.length; i += 4) {
            const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            if (luma < min) min = luma;
            if (luma > max) max = luma;
        }

        // Avoid divide by zero
        if (max <= min) return imageData;

        const newImageData = new ImageData(new Uint8ClampedArray(data), w, h);
        const newData = newImageData.data;
        const scale = 255 / (max - min);

        for (let i = 0; i < data.length; i += 4) {
            const r = (data[i] - min) * scale;
            const g = (data[i + 1] - min) * scale;
            const b = (data[i + 2] - min) * scale;
            newData[i] = r;
            newData[i + 1] = g;
            newData[i + 2] = b;
            newData[i + 3] = 255; // Alpha
        }
        return newImageData;
    }

    private denseCrop(imageData: ImageData): ImageData {
        // "Smart Crop" - Center-Out expansion.
        // We assume the text is roughly in the center (since we split lines).
        // We want to find the main text block and ignore isolated noise blobs on the edges.

        const w = imageData.width;
        const h = imageData.height;
        const data = imageData.data;

        // 1. Calculate Vertical Projection (Column Density)
        const colHasData = new Uint8Array(w);
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                if (data[(y * w + x) * 4] < 128) {
                    colHasData[x] = 1;
                    break;
                }
            }
        }

        // 2. Expand from Center
        const centerX = Math.floor(w / 2);
        const GAP_TOLERANCE = 30; // Max gap between chars.

        let minX = centerX;
        let maxX = centerX;

        // Find initial seed at center
        if (colHasData[centerX] === 0) {
            let found = false;
            for (let d = 1; d < w / 2; d++) {
                if (colHasData[centerX - d]) { minX = maxX = centerX - d; found = true; break; }
                if (colHasData[centerX + d]) { minX = maxX = centerX + d; found = true; break; }
            }
            if (!found) return imageData; // Empty image
        }

        // Expand Left
        let gapCount = 0;
        for (let x = minX - 1; x >= 0; x--) {
            if (colHasData[x] === 1) {
                minX = x;
                gapCount = 0;
            } else {
                gapCount++;
                if (gapCount > GAP_TOLERANCE) break;
            }
        }

        // Expand Right
        gapCount = 0;
        for (let x = maxX + 1; x < w; x++) {
            if (colHasData[x] === 1) {
                maxX = x;
                gapCount = 0;
            } else {
                gapCount++;
                if (gapCount > GAP_TOLERANCE) break;
            }
        }

        // 3. Vertical Crop on the identified X-range
        let minY = h, maxY = 0;
        let foundPixel = false;

        for (let y = 0; y < h; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (data[(y * w + x) * 4] < 128) {
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    foundPixel = true;
                    break;
                }
            }
        }

        if (!foundPixel) return imageData;

        // Add padding
        const pad = 4;
        minX = Math.max(0, minX - pad);
        maxX = Math.min(w, maxX + pad + 1);

        minY = Math.max(0, minY - pad);
        maxY = Math.min(h, maxY + pad + 1);

        const cropW = maxX - minX;
        const cropH = maxY - minY;

        if (cropW <= 0 || cropH <= 0) return imageData;

        // Extract
        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return imageData;

        const cropped = ctx.createImageData(cropW, cropH);
        const cData = cropped.data;
        const src = imageData.data;

        for (let y = 0; y < cropH; y++) {
            for (let x = 0; x < cropW; x++) {
                const srcIdx = ((y + minY) * w + (x + minX)) * 4;
                const dstIdx = (y * cropW + x) * 4;
                cData[dstIdx] = src[srcIdx];
                cData[dstIdx + 1] = src[srcIdx + 1];
                cData[dstIdx + 2] = src[srcIdx + 2];
                cData[dstIdx + 3] = 255;
            }
        }
        return cropped;
    }

    private deskew(imageData: ImageData): ImageData {
        const w = imageData.width;
        const h = imageData.height;

        // Helper to rotate and get data
        const getRotatedData = (angleDeg: number): ImageData => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return new ImageData(1, 1);

            // Fill white background before rotate
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);

            ctx.translate(w / 2, h / 2);
            ctx.rotate(angleDeg * Math.PI / 180);
            ctx.translate(-w / 2, -h / 2);

            // Draw previous data
            const tempC = document.createElement('canvas');
            tempC.width = w;
            tempC.height = h;
            tempC.getContext('2d')?.putImageData(imageData, 0, 0);

            ctx.drawImage(tempC, 0, 0);
            return ctx.getImageData(0, 0, w, h);
        };

        // Helper to calculate score (Variance of Row Projection)
        const calculateScore = (data: Uint8ClampedArray): number => {
            let sum = 0;
            let sumSq = 0;
            for (let y = 0; y < h; y++) {
                let rowSum = 0;
                for (let x = 0; x < w; x++) {
                    const idx = (y * w + x) * 4; // R channel is enough after contrast stretch
                    // After contrast stretch, background is white (255), text is black (0)
                    // We want to maximize variance of "ink"
                    // Invert: Ink = 255 - R
                    rowSum += (255 - data[idx]);
                }
                sum += rowSum;
                sumSq += (rowSum * rowSum);
            }
            const mean = sum / h;
            return (sumSq / h) - (mean * mean); // Variance
        };

        // Sweep angles
        // Range: -10 to 10 degrees (User requested robust deskew)
        // Step: 1 degree
        let bestAngle = 0;
        let maxScore = -1;

        for (let a = -10; a <= 10; a += 1) {
            const rotated = getRotatedData(a);
            const score = calculateScore(rotated.data);
            if (score > maxScore) {
                maxScore = score;
                bestAngle = a;
            }
        }

        console.log(`[PassportOCR] Deskew Angle: ${bestAngle}°`);

        if (bestAngle === 0) return imageData;
        return getRotatedData(bestAngle);
    }

    // --- PREPROCESSING HELPERS (CPU based) ---

    private cleanBorders(imageData: ImageData): ImageData {
        // Heuristic: If a column or row is mostly black (> 50-60%), it's likely a border or finger artifact.
        // We paint it white to prevent interference with deskew/split.
        const w = imageData.width;
        const h = imageData.height;
        const data = imageData.data;

        // 1. Vertical Clean (Columns)
        for (let x = 0; x < w; x++) {
            let blackCount = 0;
            for (let y = 0; y < h; y++) {
                const idx = (y * w + x) * 4;
                if (data[idx] < 128) blackCount++;
            }

            // If > 60% is black, clear the column
            if (blackCount > h * 0.6) {
                for (let y = 0; y < h; y++) {
                    const idx = (y * w + x) * 4;
                    data[idx] = 255;
                    data[idx + 1] = 255;
                    data[idx + 2] = 255;
                    data[idx + 3] = 255;
                }
            }
        }

        // 2. Horizontal Clean (Rows)
        // Similar check for rows (top/bottom artifacts)
        for (let y = 0; y < h; y++) {
            let blackCount = 0;
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                if (data[idx] < 128) blackCount++;
            }

            if (blackCount > w * 0.6) {
                for (let x = 0; x < w; x++) {
                    const idx = (y * w + x) * 4;
                    data[idx] = 255;
                    data[idx + 1] = 255;
                    data[idx + 2] = 255;
                    data[idx + 3] = 255;
                }
            }
        }

        return imageData;
    }

    private normalizeBrightness(imageData: ImageData): ImageData {
        const d = imageData.data;
        let min = 255;
        let max = 0;

        // 1. Find Range
        for (let i = 0; i < d.length; i += 4) {
            // Simple luminance approximation
            const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (lum < min) min = lum;
            if (lum > max) max = lum;
        }

        // Avoid divide by zero
        if (max === min) return imageData;

        // 2. Stretch
        const scale = 255 / (max - min);

        for (let i = 0; i < d.length; i += 4) {
            d[i] = (d[i] - min) * scale;
            d[i + 1] = (d[i + 1] - min) * scale;
            d[i + 2] = (d[i + 2] - min) * scale;
        }

        return imageData;
    }

    private enhanceLine(source: ImageData): ImageData {
        const w = source.width;
        const h = source.height;
        const src = source.data;
        const out = new Uint8ClampedArray(src.length);

        // 1. Strict Threshold (Binarize) -> Thinning Strategy
        // Was 140, Reducing to 95 to ignore "smudge" (light gray pixels)
        const threshold = 95;

        for (let i = 0; i < src.length; i += 4) {
            const avg = (src[i] + src[i + 1] + src[i + 2]) / 3;
            // Strict: Only very dark pixels become Black(0).
            const val = avg < threshold ? 0 : 255;
            out[i] = val;
            out[i + 1] = val;
            out[i + 2] = val;
            out[i + 3] = 255; // Alpha
        }

        // 2. Simple Morph: Bridge (Connect broken gaps) & Clean
        // Operate on 'out' buffer. But need temporary buffer to avoid ripple.
        const temp = new Uint8ClampedArray(out);

        const getVal = (x: number, y: number) => {
            if (x < 0 || x >= w || y < 0 || y >= h) return 255; // Out of bounds is White
            return temp[(y * w + x) * 4];
        };

        const setVal = (buff: Uint8ClampedArray, x: number, y: number, v: number) => {
            const idx = (y * w + x) * 4;
            buff[idx] = v;
            buff[idx + 1] = v;
            buff[idx + 2] = v;
        };

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const self = getVal(x, y);

                // Denoise (Salt): Remove single black pixel surrounded by white
                if (self === 0) {
                    let whiteNeighbors = 0;
                    if (getVal(x - 1, y) === 255) whiteNeighbors++;
                    if (getVal(x + 1, y) === 255) whiteNeighbors++;
                    if (getVal(x, y - 1) === 255) whiteNeighbors++;
                    if (getVal(x, y + 1) === 255) whiteNeighbors++;

                    if (whiteNeighbors >= 3) {
                        setVal(out, x, y, 255); // Flip to white
                        continue;
                    }
                }

                // Bridge Gap (Vertical): Black - White - Black -> Black - Black - Black
                if (self === 255) {
                    if (getVal(x, y - 1) === 0 && getVal(x, y + 1) === 0) {
                        setVal(out, x, y, 0); // Fill gap
                    }
                    // Bridge Gap (Horizontal)
                    else if (getVal(x - 1, y) === 0 && getVal(x + 1, y) === 0) {
                        setVal(out, x, y, 0);
                    }
                }
            }
        }

        return new ImageData(out, w, h);
    }

    private erode(imageData: ImageData): ImageData {
        // Morphological Erosion (Thinning)
        // Helps reduce "smudging" (bloated text) from thresholding/blurring.
        // Logic: A pixel stays BLACK only if all its 4 neighbors are BLACK. 
        // If any neighbor is WHITE, the pixel becomes WHITE (eroded).

        const w = imageData.width;
        const h = imageData.height;
        const src = imageData.data;
        const out = new ImageData(w, h); // Default transparent black
        const dst = out.data;

        // Fill White first
        for (let i = 0; i < dst.length; i++) dst[i] = 255;

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;

                // Threshold check (assuming binary input)
                if (src[idx] > 128) {
                    // It's already white, stay white
                    continue;
                }

                // It's BLACK. Check neighbors.
                const up = src[((y - 1) * w + x) * 4];
                const down = src[((y + 1) * w + x) * 4];
                const left = src[(y * w + (x - 1)) * 4];
                const right = src[(y * w + (x + 1)) * 4];

                // If all neighbors are Black (ink), keep it Black.
                // Using 128 as threshold for "Black" (<128)
                if (up < 128 && down < 128 && left < 128 && right < 128) {
                    dst[idx] = 0;
                    dst[idx + 1] = 0;
                    dst[idx + 2] = 0;
                }
                // Else it defaults to White (eroded)
            }
        }
        return out;
    }

    private upscale(imageData: ImageData, factor: number): ImageData {
        const w = imageData.width;
        const h = imageData.height;
        const newW = Math.floor(w * factor);
        const newH = Math.floor(h * factor);

        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new ImageData(1, 1);

        // Draw original scaled up
        // Need temp canvas for original
        const temp = document.createElement('canvas');
        temp.width = w;
        temp.height = h;
        temp.getContext('2d')?.putImageData(imageData, 0, 0);

        // Smoothing enabled for better upscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(temp, 0, 0, newW, newH);

        return ctx.getImageData(0, 0, newW, newH);
    }

    private toGrayscale(imageData: ImageData): ImageData {
        const data = imageData.data;
        const w = imageData.width;
        const h = imageData.height;
        const out = new ImageData(w, h); // New buffer
        const outData = out.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Luma
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            outData[i] = gray;
            outData[i + 1] = gray;
            outData[i + 2] = gray;
            outData[i + 3] = 255;
        }
        return out;
    }

    private gaussianBlur(imageData: ImageData): ImageData {
        const src = imageData.data;
        const w = imageData.width;
        const h = imageData.height;
        const out = new ImageData(w, h);
        const dst = out.data;

        // 5x5 Gaussian Kernel (approx)
        // 1  4  6  4  1
        // 4 16 24 16  4
        // 6 24 36 24  6
        // 4 16 24 16  4
        // 1  4  6  4  1
        // Sum = 256
        const kernel = [
            1, 4, 6, 4, 1,
            4, 16, 24, 16, 4,
            6, 24, 36, 24, 6,
            4, 16, 24, 16, 4,
            1, 4, 6, 4, 1
        ];
        const kernelWeight = 256;

        for (let y = 2; y < h - 2; y++) {
            for (let x = 2; x < w - 2; x++) {
                let r = 0;
                let kIdx = 0;
                // Convolve
                for (let ky = -2; ky <= 2; ky++) {
                    const rowOffset = (y + ky) * w;
                    for (let kx = -2; kx <= 2; kx++) {
                        const idx = (rowOffset + (x + kx)) * 4;
                        r += src[idx] * kernel[kIdx++]; // We only need one channel since it's grayscale
                    }
                }
                const val = r / kernelWeight;
                const idx = (y * w + x) * 4;
                dst[idx] = val;
                dst[idx + 1] = val;
                dst[idx + 2] = val;
                dst[idx + 3] = 255;
            }
        }
        // Copy edges (simplification: just leave black or copy, let's copy)
        // Actually for OCR edges don't matter much if crop is padded, but let's leave black.
        return out;
    }

    private adaptiveThreshold(imageData: ImageData): ImageData {
        // Adaptive Mean Thresholding using Integral Image
        const w = imageData.width;
        const h = imageData.height;
        const src = imageData.data;
        const out = new ImageData(w, h);
        const dst = out.data;

        // 1. Compute Integral Image
        // integral[y][x] = sum of input[0..y][0..x]
        const integral = new Float32Array(w * h);

        const getVal = (x: number, y: number) => {
            const idx = (y * w + x) * 4;
            return src[idx]; // Process grayscale input usually
        };

        for (let y = 0; y < h; y++) {
            let rowSum = 0;
            for (let x = 0; x < w; x++) {
                rowSum += getVal(x, y);
                if (y === 0) {
                    integral[y * w + x] = rowSum;
                } else {
                    integral[y * w + x] = integral[(y - 1) * w + x] + rowSum;
                }
            }
        }

        // 2. Threshold
        const s = Math.floor(w / 8) || 15; // Window size (1/8 of width or 15px)
        const halfS = Math.floor(s / 2);
        const C = 15; // Increased from 10 to 15 to reduce noise/smudge

        const getSum = (x1: number, y1: number, x2: number, y2: number) => {
            x1 = Math.max(0, x1 - 1);
            y1 = Math.max(0, y1 - 1);
            x2 = Math.min(w - 1, x2);
            y2 = Math.min(h - 1, y2);

            // Correct formula: Sum(x1..x2, y1..y2) = I(x2,y2) - I(x2, y1-1) - I(x1-1, y2) + I(x1-1, y1-1)
            let term1 = integral[y2 * w + x2];
            let term2 = (y1 <= 0) ? 0 : integral[(y1 - 1) * w + x2];
            let term3 = (x1 <= 0) ? 0 : integral[y2 * w + (x1 - 1)];
            let term4 = (x1 <= 0 || y1 <= 0) ? 0 : integral[(y1 - 1) * w + (x1 - 1)];

            return term1 - term2 - term3 + term4;
        };

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const x1 = x - halfS;
                const y1 = y - halfS;
                const x2 = x + halfS;
                const y2 = y + halfS;

                const count = (Math.min(w - 1, x2) - Math.max(0, x1) + 1) * (Math.min(h - 1, y2) - Math.max(0, y1) + 1);
                const sum = getSum(x1, y1, x2, y2);
                const mean = sum / count;

                const val = getVal(x, y);
                const idx = (y * w + x) * 4;

                // Thresholding
                if (val < (mean - C)) {
                    // Ink (Black)
                    dst[idx] = 0;
                    dst[idx + 1] = 0;
                    dst[idx + 2] = 0;
                } else {
                    // Background (White)
                    dst[idx] = 255;
                    dst[idx + 1] = 255;
                    dst[idx + 2] = 255;
                }
                dst[idx + 3] = 255;
            }
        }
        return out;
    }
}

export const passportOCRService = new PassportOCRService();
