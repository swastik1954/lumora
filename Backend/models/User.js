
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        isGuest: {
            type: Boolean,
            default: false
        },
        preferences: {
            languageMode: {
                type: String,
                enum: ["auto", "preferred"],
                default: "auto"
            },
            preferredLanguage: {
                type: String,
                enum: ["English", "Hindi", "Hinglish"],
                default: "English"
            }
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", UserSchema);

export default User;
