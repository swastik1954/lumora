
import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import User from "./models/User.js";
import Thread from "./models/Thread.js";

const app = express();

const PORT = process.env.PORT || 8080;

// Guest account retention policy
const GUEST_RETENTION_DAYS = 30;
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;

const allowedOrigins = [
    process.env.FRONTEND_URL || "https://lumora-alpha-nine.vercel.app",
    "http://localhost:5173"
];

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

// Check browser request origin
app.use("/api", (req, res, next) => {
    const origin = req.get("Origin");

    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            success: false,
            error: "Request origin not allowed"
        });
    }

    next();
});

// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "LUMORA backend is running"
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Protected chat routes
app.use("/api", chatRoutes);

// Automatically remove expired guest accounts
const cleanupGuestAccounts = async () => {
    try {
        const expiryDate = new Date(
            Date.now() - GUEST_RETENTION_DAYS * 24 * 60 * 60 * 1000
        );

        // Find guest accounts older than 30 days
        const expiredGuests = await User.find({
            isGuest: true,
            createdAt: { $lt: expiryDate }
        })
            .select("_id")
            .lean();

        if (expiredGuests.length === 0) {
            console.log("Guest cleanup: No expired accounts found.");
            return;
        }

        let deletedAccounts = 0;
        let deletedConversations = 0;

        // Recheck each account before deleting it.
        // This avoids deleting an account that was upgraded to registered
        // after the initial search.
        for (const guest of expiredGuests) {
            const deletedGuest = await User.findOneAndDelete({
                _id: guest._id,
                isGuest: true,
                createdAt: { $lt: expiryDate }
            });

            if (!deletedGuest) {
                continue;
            }

            const result = await Thread.deleteMany({
                owner: deletedGuest._id
            });

            deletedAccounts++;
            deletedConversations += result.deletedCount || 0;
        }

        console.log("Guest cleanup completed:", {
            deletedAccounts,
            deletedConversations
        });

    } catch (error) {
        console.error("Guest cleanup failed:", error);
    }
};

// MongoDB connection
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing");
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB!");

    } catch (err) {
        console.error("Failed to connect with DB:", err);
        process.exit(1);
    }
};

// Start server
const startServer = async () => {
    await connectDB();

    // Run cleanup immediately after connecting
    await cleanupGuestAccounts();

    // Repeat cleanup every 24 hours
    const cleanupTimer = setInterval(
        cleanupGuestAccounts,
        CLEANUP_INTERVAL
    );

    // Do not let the timer prevent process shutdown
    cleanupTimer.unref();

    app.listen(PORT, () => {
        console.log(`LUMORA backend running on port ${PORT}`);
        console.log("Guest account cleanup is enabled.");
    });
};

startServer();
