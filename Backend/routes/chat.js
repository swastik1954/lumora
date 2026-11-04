
import express from "express";

import Thread from "../models/Thread.js";
import User from "../models/User.js";
import getGeminiAPIResponse from "../utils/genai.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All chat and preference endpoints require authentication.
router.use(authMiddleware);

// GET: Fetch language preferences
router.get("/preferences", async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("preferences");

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            preferences: {
                languageMode: user.preferences?.languageMode || "auto",
                preferredLanguage:
                    user.preferences?.preferredLanguage || "English"
            }
        });
    } catch (err) {
        console.error("Fetch Preferences Error:", err);

        return res.status(500).json({
            success: false,
            error: "Failed to fetch preferences"
        });
    }
});

// PUT: Save language preferences
router.put("/preferences", async (req, res) => {
    try {
        const { languageMode, preferredLanguage } = req.body;

        const validModes = ["auto", "preferred"];
        const validLanguages = ["English", "Hindi", "Hinglish"];

        if (
            !validModes.includes(languageMode) ||
            !validLanguages.includes(preferredLanguage)
        ) {
            return res.status(400).json({
                success: false,
                error: "Invalid language preference"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    "preferences.languageMode": languageMode,
                    "preferences.preferredLanguage": preferredLanguage
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).select("preferences");

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Language preferences saved",
            preferences: user.preferences
        });
    } catch (err) {
        console.error("Update Preferences Error:", err);

        return res.status(500).json({
            success: false,
            error: "Failed to update preferences"
        });
    }
});

// GET: Fetch the logged-in user's conversations
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({
            owner: req.user._id
        })
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

// GET: Fetch one conversation belonging to the logged-in user
router.get("/thread/:threadId", async (req, res) => {
    try {
        const thread = await Thread.findOne({
            threadId: req.params.threadId,
            owner: req.user._id
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

// DELETE: Delete only the logged-in user's conversation
router.delete("/thread/:threadId", async (req, res) => {
    try {
        const thread = await Thread.findOneAndDelete({
            threadId: req.params.threadId,
            owner: req.user._id
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
        const cleanThreadId = threadId.trim();
        const cleanMessage = message.trim();

        let thread = await Thread.findOne({
            threadId: cleanThreadId
        });

        if (thread) {
            if (
                !thread.owner ||
                thread.owner.toString() !== req.user._id.toString()
            ) {
                return res.status(404).json({
                    error: "Conversation not found. Please start a new chat."
                });
            }
        } else {
            thread = new Thread({
                threadId: cleanThreadId,
                owner: req.user._id,
                title: cleanMessage.slice(0, 50),
                messages: []
            });
        }

        thread.messages.push({
            role: "user",
            content: cleanMessage
        });

        await thread.save();

        const conversationHistory = thread.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Get the user's saved language preferences.
        const currentUser = await User.findById(req.user._id)
            .select("preferences");

        const preferences = {
            languageMode: currentUser?.preferences?.languageMode || "auto",
            preferredLanguage:
                currentUser?.preferences?.preferredLanguage || "English"
        };

        const assistantReply = await getGeminiAPIResponse(
            conversationHistory,
            preferences
        );

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
