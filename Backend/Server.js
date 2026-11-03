
import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB!");
    } catch (err) {
        console.error("Failed to connect with DB:", err);
        process.exit(1);
    }
};

// MongoDB chat routes
app.use("/api", chatRoutes);

// Gemini API test route
app.post("/test", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: "Message is required"
            });
        }

        const { GoogleGenAI } = await import("@google/genai");

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: message
        });

        res.json({
            success: true,
            message: response.text
        });

    } catch (error) {
        console.error("Gemini API Error:", error);

        res.status(error.status || 500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`SigmaGPT running on port ${PORT}`);
    });
};

startServer();

