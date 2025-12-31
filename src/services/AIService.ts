import { GoogleGenAI } from "@google/genai"

// Use environment variable for API key (set in .env file)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""

if (!GEMINI_API_KEY) {
    console.warn("[AIService] VITE_GEMINI_API_KEY is not set. AI features will not work.")
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_NAME = "gemini-2.0-flash-exp";

export interface AIResponse {
    text: string;
    json?: any;
}

export const generateAIResponse = async (prompt: string): Promise<string> => {
    console.log("LLM REQUEST:", prompt);
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ text: prompt }],
        });

        const text = response.text ? response.text.toString().trim() : "";
        console.log("LLM RESPONSE:", text);
        return text;
    } catch (error) {
        console.error("AI Service Error:", error);
        return ""; // or throw, but returning empty string is safer for UI
    }
}

export const generateJSONResponse = async (prompt: string): Promise<any> => {
    // Append instruction to ensure JSON output if not already present
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Output ONLY valid JSON.`;

    const text = await generateAIResponse(jsonPrompt);

    try {
        // Try to find JSON block if wrapped in markdown
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text);
    } catch (e) {
        console.error("AI JSON Parse Error:", e, "Raw Text:", text);
        return {};
    }
}
