
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const getGeminiAPIResponse = async (conversationHistory) => {
    if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
        throw new Error("Conversation history is empty");
    }

    const contents = conversationHistory.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents
    });

    if (!response.text) {
        throw new Error("Gemini returned an empty response");
    }

    return response.text;
};

export default getGeminiAPIResponse;
