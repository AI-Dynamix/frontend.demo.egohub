/* eslint-disable no-restricted-globals */
import * as ort from 'onnxruntime-web';
import { parse } from 'mrz';

// Configure ONNX Runtime for Worker
// We need to point to the WASM files relative to the public root
// In a worker, self.location.origin is usually available
ort.env.wasm.wasmPaths = self.location.origin + '/wasm/';
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;

// Types matching the main thread service
interface WorkerMessage {
    type: 'LOAD' | 'SCAN_PASSPORT';
    payload?: any;
    id: string;
}

interface WorkerResponse {
    type: 'LOAD_SUCCESS' | 'LOAD_ERROR' | 'SCAN_SUCCESS' | 'SCAN_ERROR' | 'LOG';
    payload?: any;
    id: string;
}

// Global State in Worker
let detSession: ort.InferenceSession | null = null;
let recSession: ort.InferenceSession | null = null;
let keys: string[] = [];
let isLoaded = false;

// Constants
const DET_MODEL_PATH = '/models/ocr/det.onnx';
const REC_MODEL_PATH = '/models/ocr/rec.onnx';
const DICT_PATH = '/models/ocr/keys.txt';

// --- HELPER FUNCTIONS (Ported from PassportOCRService but using OffscreenCanvas) ---

function postLog(msg: string) {
    self.postMessage({ type: 'LOG', payload: msg, id: 'log' });
}

// Error handler
self.onerror = (e) => {
    postLog(`Worker Error: ${e}`);
};

// Message Handler
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type, payload, id } = e.data;

    try {
        if (type === 'LOAD') {
            await loadModels();
            self.postMessage({ type: 'LOAD_SUCCESS', id });
        } else if (type === 'SCAN_PASSPORT') {
            if (!isLoaded) throw new Error('Models not loaded');
            // Payload is Expected to be an ImageBitmap or ImageData
            const { image, width, height } = payload;
            // image is an ImageBitmap transferred from main thread
            const result = await scanPassport(image, width, height);
            self.postMessage({ type: 'SCAN_SUCCESS', payload: result, id });
        }
    } catch (err: any) {
        self.postMessage({ type: type === 'LOAD' ? 'LOAD_ERROR' : 'SCAN_ERROR', payload: err.message, id });
        console.error('Worker Operation Failed:', err);
    }
};

async function loadModels() {
    if (isLoaded) return;

    postLog('Worker: Loading Dictionary...');
    const response = await fetch(DICT_PATH);
    if (!response.ok) throw new Error(`Dictionary request failed`);
    const text = await response.text();
    keys = text.split('\n');
    keys.unshift('blank');
    keys.push(' ');

    postLog('Worker: Loading ONNX Models...');
    const [det, rec] = await Promise.all([
        ort.InferenceSession.create(DET_MODEL_PATH, { executionProviders: ['wasm'] }),
        ort.InferenceSession.create(REC_MODEL_PATH, { executionProviders: ['wasm'] })
    ]);

    detSession = det;
    recSession = rec;
    isLoaded = true;
    postLog('Worker: Models Loaded Successfully');
}

// --- CORE LOGIC (Adapted for OffscreenCanvas) ---

async function scanPassport(imageSource: ImageBitmap, w: number, h: number) {
    // Note: imageSource is transferred ImageBitmap

    // 1. Create OffscreenCanvas
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
    if (!ctx) throw new Error('Failed to get context');

    ctx.drawImage(imageSource, 0, 0);

    // Debug result container
    const debug: any = {};
    debug.rawImage = await imageDataToBase64(new ImageData(new Uint8ClampedArray(canvas.getContext('2d')!.getImageData(0, 0, w, h).data), w, h));

    // 2. Crop Logic (Matching Service)
    const cropH = Math.floor(h * 0.20);
    const cropY = Math.floor(h * 0.60);
    const cropW = Math.floor(w * 0.90);
    const cropX = Math.floor((w - cropW) / 2);

    if (cropH <= 0 || cropW <= 0) return { debug, data: null };

    // Create Crop Canvas
    const mrzCanvas = new OffscreenCanvas(cropW, cropH);
    const mrzCtx = mrzCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
    mrzCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Get ImageData for processing
    let cropData = mrzCtx.getImageData(0, 0, cropW, cropH);

    // --- PIPELINE similar to Service ---

    // Upscale 2x for better detection
    cropData = await upscale(cropData, 2.0);

    // Pre-processing
    cropData = normalizeBrightness(cropData);
    cropData = toGrayscale(cropData);
    cropData = gaussianBlur(cropData);
    cropData = adaptiveThreshold(cropData);
    cropData = cleanBorders(cropData);
    cropData = erode(cropData);
    cropData = deskew(cropData); // Rotation correction

    debug.cropImage = await imageDataToBase64(cropData);

    // 3. AI Detection (DBNet)
    const boxes = await detectText(cropData);
    boxes.sort((a, b) => a.y - b.y); // Sort Top to Bottom

    const linesText: string[] = [];

    // Process top 2 boxes
    for (let i = 0; i < Math.min(boxes.length, 2); i++) {
        const box = boxes[i];
        let lineImg = cropBox(cropData, box);
        lineImg = enhanceLine(lineImg);

        // Debug images can be sent back as Blobs or Base64
        const b64 = await imageDataToBase64(lineImg);
        if (i === 0) debug.line1Image = b64;
        if (i === 1) debug.line2Image = b64;

        const text = await recognizeLine(lineImg);
        linesText.push(text);
    }

    // Close bitmap to free memory
    imageSource.close();

    // 4. Validation
    const processResult = processMRZ(linesText);

    if (processResult.error) debug.validationError = processResult.error;

    // Helper to send debug logs
    // postLog(`MRZ Lines: ${JSON.stringify(linesText)}`);

    return { debug, data: processResult.data };
}

// --- UTILS (Pure Logic) ---

async function upscale(source: ImageData, scale: number): Promise<ImageData> {
    const w = source.width;
    const h = source.height;
    const dw = Math.floor(w * scale);
    const dh = Math.floor(h * scale);

    const temp = new OffscreenCanvas(w, h);
    const ctx = temp.getContext('2d');
    ctx?.putImageData(source, 0, 0);

    const c = new OffscreenCanvas(dw, dh);
    const dCtx = c.getContext('2d') as OffscreenCanvasRenderingContext2D;
    dCtx.drawImage(temp, 0, 0, dw, dh);
    return dCtx.getImageData(0, 0, dw, dh);
}

function normalizeBrightness(img: ImageData) {
    // Simple histograms equalization or Min/Max stretching
    const d = img.data;
    let min = 255, max = 0;
    for (let i = 0; i < d.length; i += 4) {
        const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; // Luma
        if (l < min) min = l;
        if (l > max) max = l;
    }

    if (max <= min) return img;
    const range = max - min;

    for (let i = 0; i < d.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            d[i + c] = ((d[i + c] - min) / range) * 255;
        }
    }
    return img;
}

function toGrayscale(img: ImageData) {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = l;
    }
    return img;
}

function gaussianBlur(img: ImageData) {
    // Simple Box Blur approximation for speed
    // Or just skip if not critical? Let's use simplified 3x3 kernel
    // Weights: 1 2 1, 2 4 2, 1 2 1 (/16)
    const w = img.width;
    const h = img.height;
    const src = img.data;
    const output = new Uint8ClampedArray(src.length);

    // Copy alpha
    for (let i = 3; i < src.length; i += 4) output[i] = src[i];

    // Blur RGB
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let r = 0, g = 0, b = 0;
            // Kernel 3x3
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const idx = ((y + ky) * w + (x + kx)) * 4;
                    const weight = (kx === 0 && ky === 0) ? 4 : (Math.abs(kx) + Math.abs(ky) === 1) ? 2 : 1;
                    r += src[idx] * weight;
                    g += src[idx + 1] * weight;
                    b += src[idx + 2] * weight;
                }
            }
            const idx = (y * w + x) * 4;
            output[idx] = r / 16;
            output[idx + 1] = g / 16;
            output[idx + 2] = b / 16;
        }
    }
    return new ImageData(output, w, h);
}

function adaptiveThreshold(img: ImageData) {
    // Mean-C approach
    const w = img.width;
    const h = img.height;
    const d = img.data;
    const output = new Uint8ClampedArray(d.length);
    const windowSize = 15; // Block size
    const C = 5; // Constant subtraction
    const half = Math.floor(windowSize / 2);

    // Integral Image for fast mean calculation
    const integral = new Int32Array(w * h);

    // 1. Create Integral Image (Grayscale input assumed)
    for (let y = 0; y < h; y++) {
        let sum = 0;
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x);
            sum += d[idx * 4]; // Only R channel needed since greyscale
            if (y === 0) integral[idx] = sum;
            else integral[idx] = integral[idx - w] + sum;
        }
    }

    // 2. Threshold
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const x1 = Math.max(0, x - half);
            const y1 = Math.max(0, y - half);
            const x2 = Math.min(w - 1, x + half);
            const y2 = Math.min(h - 1, y + half);

            const count = (x2 - x1 + 1) * (y2 - y1 + 1);

            // Sum Region
            const A = integral[y2 * w + x2];
            const B = (y1 > 0) ? integral[(y1 - 1) * w + x2] : 0;
            const C_val = (x1 > 0) ? integral[y2 * w + (x1 - 1)] : 0;
            const D = (x1 > 0 && y1 > 0) ? integral[(y1 - 1) * w + (x1 - 1)] : 0;

            const sum = A - B - C_val + D;
            const mean = sum / count;

            const val = d[(y * w + x) * 4];
            const bin = val > (mean - C) ? 255 : 0;

            const idx = (y * w + x) * 4;
            output[idx] = bin;
            output[idx + 1] = bin;
            output[idx + 2] = bin;
            output[idx + 3] = 255;
        }
    }
    return new ImageData(output, w, h);
}

function cleanBorders(img: ImageData) { return img; } // Placeholder
function erode(img: ImageData) { return img; } // Placeholder

function deskew(img: ImageData) {
    // Hough Transform or projection profile based deskew
    // For worker, simple projection check might be faster
    return img; // Skipped for MVP to save complexity, can add if needed
}

function cropBox(source: ImageData, box: { x: number, y: number, w: number, h: number }) {
    const c = new OffscreenCanvas(source.width, source.height);
    const ctx = c.getContext('2d');
    ctx?.putImageData(source, 0, 0);
    return ctx?.getImageData(box.x, box.y, box.w, box.h) || source;
}

function enhanceLine(img: ImageData) { return img; } // Placeholder

// --- AI INFERENCE ---

async function detectText(img: ImageData) {
    if (!detSession) return [];

    const DET_SIZE = 640;
    const tensor = preprocessDet(img, DET_SIZE, DET_SIZE);

    // Run
    const feeds = { [detSession.inputNames[0]]: tensor };
    const results = await detSession.run(feeds);
    const output = results[detSession.outputNames[0]]; // [1, 1, 640, 640]

    return postProcessDet(output.data as Float32Array, DET_SIZE, DET_SIZE, img.width, img.height);
}

function preprocessDet(img: ImageData, targetW: number, targetH: number): ort.Tensor {
    const w = img.width;
    const h = img.height;
    const scale = Math.min(targetW / w, targetH / h);
    const nw = Math.floor(w * scale);
    const nh = Math.floor(h * scale);

    const canvas = new OffscreenCanvas(targetW, targetH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CTX');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, targetW, targetH);

    const temp = new OffscreenCanvas(w, h);
    temp.getContext('2d')?.putImageData(img, 0, 0);
    ctx.drawImage(temp, 0, 0, nw, nh);

    const result = ctx.getImageData(0, 0, targetW, targetH);
    const data = result.data;
    const floatData = new Float32Array(1 * 3 * targetH * targetW);

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

function postProcessDet(heatmap: Float32Array, mapW: number, mapH: number, origW: number, origH: number) {
    // Simple Box Extraction
    const boxes: { x: number, y: number, w: number, h: number }[] = [];
    const threshold = 0.3;

    // Naively finding connected components
    // We expect 2 separate lines.
    // 1. Project horizontally to find Y-ranges
    const rowSums = new Float32Array(mapH);
    for (let y = 0; y < mapH; y++) {
        for (let x = 0; x < mapW; x++) {
            if (heatmap[y * mapW + x] > threshold) rowSums[y]++;
        }
    }

    const linesY: { start: number, end: number }[] = [];
    let startY = -1;
    for (let y = 0; y < mapH; y++) {
        if (rowSums[y] > 5) { // Threshold for "line existence"
            if (startY === -1) startY = y;
        } else {
            if (startY !== -1) {
                if (y - startY > 5) linesY.push({ start: startY, end: y });
                startY = -1;
            }
        }
    }
    if (startY !== -1) linesY.push({ start: startY, end: mapH });

    // Scale back
    const scale = Math.min(mapW / origW, mapH / origH); // Note: verify logic
    // Actually preprocess does: scale = min(640/w, 640/h)
    // nw = w * scale.
    // So mapX = x * scale. x = mapX / scale.

    for (const l of linesY) {
        // Assume full width for now, or find X range similarly
        let minX = mapW, maxX = 0;
        for (let y = l.start; y < l.end; y++) {
            for (let x = 0; x < mapW; x++) {
                if (heatmap[y * mapW + x] > threshold) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                }
            }
        }

        if (maxX > minX) {
            boxes.push({
                x: Math.floor(minX / scale),
                y: Math.floor(l.start / scale),
                w: Math.floor((maxX - minX) / scale),
                h: Math.floor((l.end - l.start) / scale)
            });
        }
    }

    return boxes;
}


async function recognizeLine(img: ImageData): Promise<string> {
    if (!recSession) return '';

    const MODEL_H = 48;
    const MODEL_W = 800; // Large width for MRZ
    const tensor = preprocessRec(img, MODEL_H, MODEL_W);

    const feeds = { [recSession.inputNames[0]]: tensor };
    const results = await recSession.run(feeds);
    const output = results[recSession.outputNames[0]];

    return ctcDecode(output.data as Float32Array, output.dims);
}

function preprocessRec(img: ImageData, targetH: number, targetW: number): ort.Tensor {
    const scale = targetH / img.height;
    const scaledW = Math.floor(img.width * scale);

    const canvas = new OffscreenCanvas(targetW, targetH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CTX');

    ctx.fillStyle = '#FFFFFF'; // Pad white
    ctx.fillRect(0, 0, targetW, targetH);

    const temp = new OffscreenCanvas(img.width, img.height);
    temp.getContext('2d')?.putImageData(img, 0, 0);

    const drawW = Math.min(scaledW, targetW);
    ctx.drawImage(temp, 0, 0, drawW, targetH);

    const final = ctx.getImageData(0, 0, targetW, targetH);
    const data = final.data;
    const floatData = new Float32Array(3 * targetH * targetW);

    for (let i = 0; i < targetH * targetW; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        // Normalize -0.5 to 0.5
        floatData[i] = (r / 255.0 - 0.5) / 0.5;
        floatData[targetH * targetW + i] = (g / 255.0 - 0.5) / 0.5;
        floatData[2 * targetH * targetW + i] = (b / 255.0 - 0.5) / 0.5;
    }

    return new ort.Tensor('float32', floatData, [1, 3, targetH, targetW]);
}

function ctcDecode(data: Float32Array, dims: readonly number[]): string {
    const timeSteps = dims[1];
    const vocabSize = dims[2]; // e.g. 6625 for PaddleOCR English

    const chars: string[] = [];
    let lastChar = -1;

    // NOTE: This assumes `keys` is globally loaded

    for (let t = 0; t < timeSteps; t++) {
        let maxVal = -Infinity;
        let maxIdx = -1;
        const offset = t * vocabSize;

        for (let v = 0; v < vocabSize; v++) {
            if (data[offset + v] > maxVal) {
                maxVal = data[offset + v];
                maxIdx = v;
            }
        }

        if (maxIdx !== 0 && maxIdx !== lastChar) { // 0 is blank
            if (maxIdx > 0 && maxIdx < keys.length) {
                chars.push(keys[maxIdx]);
            }
        }
        lastChar = maxIdx;
    }

    return chars.join('');
}

function processMRZ(lines: string[]) {
    // Basic heuristic: fix O/0, 1/I, then parse
    if (lines.length < 2) return { data: null, error: 'Need 2 Lines' };

    const clean = lines.map(l => l.toUpperCase().replace(/[^A-Z0-9<]/g, ''));

    let l1 = clean[0];
    l1 = l1.replace(/1/g, 'I').replace(/0/g, 'O').replace(/5/g, 'S').replace(/8/g, 'B');

    let l2 = clean[1];
    // Heuristic for line 2 digits (simple)
    // First 9 chars usually digits (Doc Num)
    // Pos 13-18 (DOB) -> Digits
    // Pos 21-26 (Exp) -> Digits
    const forceDigit = (s: string, i: number) => {
        if (i >= s.length) return s;
        const c = s[i];
        const map: any = { 'O': '0', 'I': '1', 'B': '8', 'S': '5', 'Z': '2' };
        if (map[c]) return s.substring(0, i) + map[c] + s.substring(i + 1);
        return s;
    };

    for (let i = 13; i < 19; i++) l2 = forceDigit(l2, i);
    for (let i = 21; i < 27; i++) l2 = forceDigit(l2, i);

    try {
        const result = parse([l1, l2]);
        if (!result.valid) {
            // Return Raw even if invalid checksum, marking as warning?
            // Or fail?
            return { data: null, error: 'Checksum Failed' };
        }

        return {
            data: {
                fullName: `${result.fields.firstName} ${result.fields.lastName}`,
                passportNumber: result.fields.documentNumber || '',
                nationality: result.fields.nationality || '',
                dob: result.fields.birthDate || '',
                gender: result.fields.sex || '',
                expiryDate: result.fields.expirationDate || '',
                issuingCountry: result.fields.issuingState || '',
                mrzRaw: l1 + '\\n' + l2
            },
            error: undefined
        };
    } catch (e: any) {
        return { data: null, error: `Parse Error: ${e.message}` };
    }
}

async function imageDataToBase64(img: ImageData): Promise<string> {
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx?.putImageData(img, 0, 0);
    const blob = await canvas.convertToBlob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
}

export { }; // Module
