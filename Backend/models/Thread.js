
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ThreadSchema = new mongoose.Schema(
    {
        threadId: {
            type: String,
            required: true,
            unique: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true
        },
        title: {
            type: String,
            default: "New Chat"
        },
        messages: [MessageSchema]
    },
    {
        timestamps: true
    }
);

const Thread = mongoose.model("Thread", ThreadSchema);

export default Thread;
