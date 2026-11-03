
import express from "express";
import Thread from "../models/Thread.js";
import getGeminiAPIResponse from "../utils/genai.js";

const router = express.Router();

// GET: Fetch all conversations
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({})
            .select("threadId title createdAt updatedAt")
            .sort({ updatedAt: -1 });

        return res.status(200).json(threads);
    } catch (err) {
        console.error("Fetch Threads Error:", err);
        return res.status(500).json({
            error: "Failed to fetch conversations"
        });
    }
});

// GET: Fetch messages from one conversation
router.get("/thread/:threadId", async (req, res) => {
    try {
        const thread = await Thread.findOne({
            threadId: req.params.threadId
        });

        if (!thread) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        return res.status(200).json(thread.messages);
    } catch (err) {
        console.error("Fetch Conversation Error:", err);
        return res.status(500).json({
            error: "Failed to load conversation"
        });
    }
});

// DELETE: Delete a conversation
router.delete("/thread/:threadId", async (req, res) => {
    try {
        const thread = await Thread.findOneAndDelete({
            threadId: req.params.threadId
        });

        if (!thread) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Conversation deleted successfully"
        });
    } catch (err) {
        console.error("Delete Thread Error:", err);
        return res.status(500).json({
            error: "Failed to delete conversation"
        });
    }
});

// POST: Send a message and get a Gemini response
router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;

    if (
        typeof threadId !== "string" ||
        !threadId.trim() ||
        typeof message !== "string" ||
        !message.trim()
    ) {
        return res.status(400).json({
            error: "A valid threadId and message are required"
        });
    }

    try {
        let thread = await Thread.findOne({
            threadId: threadId.trim()
        });

        if (!thread) {
            thread = new Thread({
                threadId: threadId.trim(),
                title: message.trim().slice(0, 50),
                messages: []
            });
        }

        // Save the user's message first.
        thread.messages.push({
            role: "user",
            content: message.trim()
        });

        await thread.save();

        // Pass the complete conversation to Gemini.
        const conversationHistory = thread.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const assistantReply = await getGeminiAPIResponse(
            conversationHistory
        );

        // Save Gemini's response.
        thread.messages.push({
            role: "assistant",
            content: assistantReply
        });

        await thread.save();

        return res.status(200).json({
            success: true,
            reply: assistantReply,
            threadId: thread.threadId
        });

    } catch (err) {
        console.error("Chat Error:", err);

        return res.status(500).json({
            success: false,
            error: err.message || "Failed to generate response"
        });
    }
});

export default router;
