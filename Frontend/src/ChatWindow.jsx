
import "./ChatWindow.css";

import SparkleIcon from "./SparkleIcon.jsx";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";

import { useContext, useState } from "react";
import { ScaleLoader } from "react-spinners";

const API_URL = import.meta.env.VITE_API_URL || "https://lumora-backend-lmun.onrender.com";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        setReply,
        currThreadId,
        setPrevChats,
        setNewChat,
        fetchThreads
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");

    // Send message to Gemini
    const getReply = async () => {
        const message = prompt.trim();

        if (!message || loading) return;

        setLoading(true);
        setError("");
        setNewChat(false);
        setReply(null);
        setPrompt("");

        // Display user message immediately
        setPrevChats(prev => [
            ...prev,
            {
                role: "user",
                content: message
            }
        ]);

        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message,
                    threadId: currThreadId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to get Gemini response"
                );
            }

            // Display Gemini response
            setPrevChats(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: data.reply
                }
            ]);

            // Trigger typing animation
            setReply(data.reply);

            // Refresh sidebar history
            if (fetchThreads) {
                await fetchThreads();
            }

        } catch (err) {
            console.error("Chat Error:", err);
            setError(err.message || "Something went wrong");

        } finally {
            setLoading(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            getReply();
        }
    };

    return (
        <div className="chatWindow">

            {/* Navbar */}
            <div className="navbar">
                <span className="navbarLogo">
                    <span className="logoMark">
                        <SparkleIcon size={21} />
                    </span>

                    LUMORA

                    <i className="fa-solid fa-chevron-down"></i>
                </span>

                <button
                    className="userIconDiv"
                    onClick={() => setIsOpen(prev => !prev)}
                    aria-label="Open profile menu"
                    aria-expanded={isOpen}
                >
                    <span className="userIcon">
                        <i className="fa-solid fa-user"></i>
                    </span>
                </button>
            </div>

            {/* Profile Dropdown */}
            {isOpen && (
                <div className="dropDown">
                    <div className="dropDownItem">
                        <i className="fa-solid fa-gear"></i>
                        Settings
                    </div>

                    <div className="dropDownItem">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        Upgrade plan
                    </div>

                    <div className="dropDownItem">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        Log out
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <Chat />

            {/* Loading Animation */}
            {loading && (
                <div className="loader">
                    <ScaleLoader color="#ffffff" height={25} />
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="chatError">
                    {error}
                </div>
            )}

            {/* Chat Input */}
            <div className="chatInput">
                <div className="inputBox">

                    <input
                        type="text"
                        placeholder="Ask anything..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />

                    <button
                        id="submit"
                        onClick={getReply}
                        disabled={loading || !prompt.trim()}
                        aria-label="Send message"
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </button>

                </div>

                <p className="info">
                    LUMORA can make mistakes. Check important info.
                    See Cookie Preferences.
                </p>
            </div>

        </div>
    );
}

export default ChatWindow;
