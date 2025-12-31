import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

// Cấu hình cứng theo key/region (có thể chuyển vào env nếu cần bảo mật hơn)
const SPEECH_KEY = "FE2sz1UC5Sz6afMKz7pBoOWgQdQi9wOjMPWrKn6djMVI71EDqvsIJQQJ99BLACqBBLyXJ3w3AAAYACOGsNYT";
const SPEECH_REGION = "southeastasia";

// Biến lưu Cache: Key là (text + voiceName), Value là đường dẫn file âm thanh (Blob URL)
const voiceCache: Map<string, string> = new Map();

// Map language codes to Azure Neural Voices
export const VOICE_MAP: Record<string, string> = {
    'vn': 'vi-VN-HoaiMyNeural',
    'en': 'en-US-AvaMultilingualNeural',
    'jp': 'ja-JP-NanamiNeural',
    'kr': 'ko-KR-SunHiNeural',
    'cn': 'zh-CN-XiaoxiaoNeural',
    'default': 'en-US-AvaMultilingualNeural'
};

/**
 * Hàm này sẽ kiểm tra cache trước. 
 * - Nếu có: trả về URL âm thanh ngay lập tức.
 * - Nếu không: gọi Azure, lưu kết quả vào cache, rồi trả về URL.
 */
export interface TTSOptions {
    text: string
    textId: string // Unique ID for specific content (e.g. 'welcome_greeting')
    version?: string // Version string (e.g. 'v1') to bust cache on content update
    langCode?: string
}

/**
 * Hàm này sẽ kiểm tra cache trước. 
 * - Key cache: `${textId}:${version}:${langCode}`
 * - Nếu có: trả về URL âm thanh ngay lập tức.
 * - Nếu không: gọi Azure, lưu kết quả vào cache, rồi trả về URL.
 */
export const getVoiceAudioUrl = ({ text, textId, version = 'v1', langCode = 'en' }: TTSOptions): Promise<string> => {
    return new Promise((resolve, reject) => {
        const voiceName = VOICE_MAP[langCode] || VOICE_MAP['default'];
        // Use textId + version for stable caching independent of voice change, 
        // OR include voiceName to support changing voices. 
        // Suggestion: keep voiceName in key to allow switching voices for same textId
        const cacheKey = `${textId}:${version}:${voiceName}`;

        // 1. KIỂM TRA CACHE
        if (voiceCache.has(cacheKey)) {
            console.log("⚡ [Cache Hit]", cacheKey);
            resolve(voiceCache.get(cacheKey)!);
            return;
        }

        console.log("☁️ [API Call] Azure TTS:", textId, "Voice:", voiceName);

        // 2. CẤU HÌNH AZURE
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
        speechConfig.speechSynthesisVoiceName = voiceName;

        // Quan trọng: Set output là null để không tự phát tiếng, ta chỉ lấy dữ liệu
        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null as any); // Type cast null to any if strict null checks complain, or undefined depending on definitions

        // 3. THỰC HIỆN TỔNG HỢP
        synthesizer.speakTextAsync(
            text,
            (result) => {
                if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                    // Chuyển đổi dữ liệu nhị phân sang Blob URL để trình duyệt phát được
                    const blob = new Blob([result.audioData], { type: 'audio/mp3' });
                    const url = URL.createObjectURL(blob);

                    // Lưu vào Cache
                    voiceCache.set(cacheKey, url);

                    synthesizer.close();
                    resolve(url);
                } else {
                    console.error("Lỗi Azure TTS:", result.errorDetails);
                    synthesizer.close();
                    reject(result.errorDetails);
                }
            },
            (err) => {
                console.error("Lỗi SDK:", err);
                synthesizer.close();
                reject(err);
            }
        );
    });
};
