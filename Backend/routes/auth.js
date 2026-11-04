
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID, randomBytes } from "crypto";

import User from "../models/User.js";
import Thread from "../models/Thread.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_NAME = "lumora_token";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/"
};

const setAuthCookie = (res, userId, duration = SEVEN_DAYS) => {
    const token = jwt.sign(
        { userId: userId.toString() },
        process.env.JWT_SECRET,
        { expiresIn: Math.floor(duration / 1000) }
    );

    res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: duration
    });
};

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.isGuest ? null : user.email,
    isGuest: user.isGuest
});

// GUEST SESSION
router.post("/guest", async (req, res) => {
    try {
        const guestEmail = `guest-${randomUUID()}@guest.lumora.invalid`;
        const randomPassword = randomBytes(48).toString("hex");
        const hashedPassword = await bcrypt.hash(randomPassword, 12);

        const guest = await User.create({
            name: "Guest",
            email: guestEmail,
            password: hashedPassword,
            isGuest: true
        });

        setAuthCookie(res, guest._id, THIRTY_DAYS);

        return res.status(201).json({
            success: true,
            message: "Guest session created",
            user: publicUser(guest)
        });
    } catch (error) {
        console.error("Guest Session Error:", error);

        return res.status(500).json({
            success: false,
            error: "Unable to start guest session"
        });
    }
});

// SIGNUP OR UPGRADE GUEST ACCOUNT
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                error: "Please provide valid signup details"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length < 2 || cleanName.length > 50) {
            return res.status(400).json({
                success: false,
                error: "Name must be between 2 and 50 characters"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                error: "Please enter a valid email address"
            });
        }

        if (
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                success: false,
                error: "Password must be at least 8 characters and no more than 72 bytes"
            });
        }

        const existingUser = await User.findOne({ email: cleanEmail });

        // If the current session belongs to a guest, upgrade that account.
        let currentGuest = null;

        try {
            const token = req.cookies?.[COOKIE_NAME];

            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                currentGuest = await User.findOne({
                    _id: decoded.userId,
                    isGuest: true
                });
            }
        } catch {
            currentGuest = null;
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: "An account with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        let user;

        if (currentGuest) {
            currentGuest.name = cleanName;
            currentGuest.email = cleanEmail;
            currentGuest.password = hashedPassword;
            currentGuest.isGuest = false;

            user = await currentGuest.save();
        } else {
            user = await User.create({
                name: cleanName,
                email: cleanEmail,
                password: hashedPassword,
                isGuest: false
            });
        }

        setAuthCookie(res, user._id);

        return res.status(201).json({
            success: true,
            message: currentGuest
                ? "Guest account upgraded successfully"
                : "Account created successfully",
            user: publicUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: "An account with this email already exists"
            });
        }

        console.error("Signup Error:", error);

        return res.status(500).json({
            success: false,
            error: "Unable to create account"
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                error: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            isGuest: false
        }).select("+password");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        setAuthCookie(res, user._id);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: publicUser(user)
        });
    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            error: "Unable to log in"
        });
    }
});

// CHECK CURRENT SESSION
router.get("/me", authMiddleware, (req, res) => {
    return res.status(200).json({
        success: true,
        user: publicUser(req.user)
    });
});

// LOGOUT
router.post("/logout", async (req, res) => {
    try {
        const token = req.cookies?.[COOKIE_NAME];

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                const guest = await User.findOne({
                    _id: decoded.userId,
                    isGuest: true
                });

                // Remove guest conversations and account on explicit logout.
                if (guest) {
                    await Thread.deleteMany({ owner: guest._id });
                    await User.deleteOne({ _id: guest._id });
                }
            } catch {
                // An expired or invalid token will simply be cleared.
            }
        }

        res.clearCookie(COOKIE_NAME, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout Error:", error);

        res.clearCookie(COOKIE_NAME, cookieOptions);

        return res.status(500).json({
            success: false,
            error: "Unable to complete logout"
        });
    }
});

export default router;
