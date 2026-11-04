
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.lumora_token;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Please log in or continue as guest"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select(
            "_id name email isGuest"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "User account not found"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: "Invalid or expired session"
        });
    }
};

export default authMiddleware;
