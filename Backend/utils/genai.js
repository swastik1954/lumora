
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const getLanguageInstruction = (preferences = {}) => {
    const mode = preferences.languageMode || "auto";
    const language = preferences.preferredLanguage || "English";

    if (mode === "preferred") {
        const instructions = {
            English: "Always respond in clear, natural English.",
            Hindi: "Always respond in natural Hindi using Devanagari script. Explain technical terms simply.",
            Hinglish: "Always respond in natural Hinglish, mixing Hindi and English conversationally. Use Roman script."
        };

        return instructions[language] || instructions.English;
    }

    return `
Automatically detect the language and writing style of the user's latest message.

Follow these rules:
1. If the user writes in English, respond in English.
2. If the user writes in Hindi, respond in Hindi using Devanagari script.
3. If the user writes in Hinglish, respond naturally in Hinglish using Roman script.
4. If the user writes in another language, respond in that same language whenever possible.
5. If the user mixes languages, naturally match their language mix.
6. Do not force English on users who communicate in another language.
7. Keep technical explanations understandable in the language the user uses.
8. Maintain the same language throughout the response unless the user requests otherwise.
9. Do not mention that you are detecting the user's language.
`;
};

const getGeminiAPIResponse = async (
    conversationHistory,
    preferences = {}
) => {
    if (
        !Array.isArray(conversationHistory) ||
        conversationHistory.length === 0
    ) {
        throw new Error("Conversation history is empty");
    }

    const contents = conversationHistory.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents,
        config: {
            systemInstruction: getLanguageInstruction(preferences)
        }
    });

    if (!response.text) {
        throw new Error("Gemini returned an empty response");
    }

    return response.text;
};

export default getGeminiAPIResponse;
