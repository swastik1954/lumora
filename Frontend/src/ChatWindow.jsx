
import "./ChatWindow.css";

import SparkleIcon from "./SparkleIcon.jsx";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";

import { useContext, useState } from "react";
import { ScaleLoader } from "react-spinners";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const defaultPreferences = {
    languageMode: "auto",
    preferredLanguage: "English"
};

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        setReply,
        currThreadId,
        setPrevChats,
        setNewChat,
        fetchThreads,
        user,
        logout,
        startAccountUpgrade
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState("");

    // Settings state
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState(defaultPreferences);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [settingsSuccess, setSettingsSuccess] = useState("");

    // Send message to Gemini
    const getReply = async () => {
        const message = prompt.trim();

        if (!message || loading) return;

        setLoading(true);
        setError("");
        setNewChat(false);
        setReply(null);
        setPrompt("");

        setPrevChats((prev) => [
            ...prev,
            {
                role: "user",
                content: message
            }
        ]);

        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message,
                    threadId: currThreadId
                })
            });

            const data = await response.json();

            if (response.status === 401) {
                await logout();
                throw new Error(
                    "Your session expired. Please sign in again."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to get Gemini response"
                );
            }

            setPrevChats((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: data.reply
                }
            ]);

            setReply(data.reply);

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

    // Handle logout
    const handleLogout = async () => {
        setIsOpen(false);
        await logout();
    };

    // Handle guest account upgrade
    const handleUpgrade = () => {
        setIsOpen(false);

        if (startAccountUpgrade) {
            startAccountUpgrade();
        }
    };

    // Open settings and load saved preferences
    const openSettings = async () => {
        setIsOpen(false);
        setShowSettings(true);
        setSettingsError("");
        setSettingsSuccess("");
        setSettingsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/preferences`, {
                credentials: "include"
            });

            const data = await response.json();

            if (response.status === 401) {
                await logout();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.error || "Could not load language preferences"
                );
            }

            setPreferences({
                languageMode:
                    data.preferences?.languageMode || "auto",
                preferredLanguage:
                    data.preferences?.preferredLanguage || "English"
            });
        } catch (err) {
            console.error("Settings Error:", err);
            setSettingsError(err.message);
        } finally {
            setSettingsLoading(false);
        }
    };

    // Save preferences to MongoDB
    const saveSettings = async () => {
        setSettingsSaving(true);
        setSettingsError("");
        setSettingsSuccess("");

        try {
            const response = await fetch(`${API_URL}/api/preferences`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(preferences)
            });

            const data = await response.json();

            if (response.status === 401) {
                await logout();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.error || "Could not save preferences"
                );
            }

            setPreferences(data.preferences);
            setSettingsSuccess("Your language preference has been saved.");
        } catch (err) {
            console.error("Save Settings Error:", err);
            setSettingsError(err.message);
        } finally {
            setSettingsSaving(false);
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
                    onClick={() => setIsOpen((prev) => !prev)}
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
                        <i className="fa-solid fa-user"></i>
                        {user?.name || "My Account"}
                    </div>

                    {user?.isGuest ? (
                        <div className="dropDownItem">
                            <i className="fa-solid fa-user-clock"></i>
                            Guest account
                        </div>
                    ) : (
                        <div className="dropDownItem">
                            <i className="fa-solid fa-envelope"></i>
                            {user?.email || ""}
                        </div>
                    )}

                    <button
                        type="button"
                        className="dropDownItem"
                        onClick={openSettings}
                    >
                        <i className="fa-solid fa-gear"></i>
                        Settings
                    </button>

                    {user?.isGuest && (
                        <button
                            type="button"
                            className="dropDownItem"
                            onClick={handleUpgrade}
                        >
                            <i className="fa-solid fa-user-plus"></i>
                            Save my conversations
                        </button>
                    )}

                    <button
                        type="button"
                        className="dropDownItem"
                        onClick={handleLogout}
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        Log out
                    </button>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div
                    className="settingsOverlay"
                    onClick={() => setShowSettings(false)}
                >
                    <div
                        className="settingsModal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="settingsHeader">
                            <div>
                                <h2>Settings</h2>
                                <p>Customize your LUMORA experience.</p>
                            </div>

                            <button
                                type="button"
                                className="settingsClose"
                                onClick={() => setShowSettings(false)}
                                aria-label="Close settings"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="settingsContent">
                            <div className="settingsSectionTitle">
                                <i className="fa-solid fa-language"></i>
                                Language preferences
                            </div>

                            <p className="settingsDescription">
                                Choose how LUMORA communicates with you.
                            </p>

                            {settingsLoading ? (
                                <div className="settingsLoading">
                                    <ScaleLoader
                                        color="#6ea8ff"
                                        height={22}
                                    />
                                    <span>Loading preferences...</span>
                                </div>
                            ) : (
                                <>
                                    <label
                                        className="settingsLabel"
                                        htmlFor="languageMode"
                                    >
                                        Response language mode
                                    </label>

                                    <select
                                        id="languageMode"
                                        className="settingsSelect"
                                        value={preferences.languageMode}
                                        onChange={(e) => {
                                            setPreferences((prev) => ({
                                                ...prev,
                                                languageMode: e.target.value
                                            }));
                                            setSettingsSuccess("");
                                        }}
                                    >
                                        <option value="auto">
                                            Automatic detection
                                        </option>
                                        <option value="preferred">
                                            Always use my preferred language
                                        </option>
                                    </select>

                                    <label
                                        className="settingsLabel"
                                        htmlFor="preferredLanguage"
                                    >
                                        Preferred language
                                    </label>

                                    <select
                                        id="preferredLanguage"
                                        className="settingsSelect"
                                        value={preferences.preferredLanguage}
                                        disabled={
                                            preferences.languageMode === "auto"
                                        }
                                        onChange={(e) => {
                                            setPreferences((prev) => ({
                                                ...prev,
                                                preferredLanguage: e.target.value
                                            }));
                                            setSettingsSuccess("");
                                        }}
                                    >
                                        <option value="English">
                                            English
                                        </option>
                                        <option value="Hindi">
                                            हिन्दी (Hindi)
                                        </option>
                                        <option value="Hinglish">
                                            Hinglish
                                        </option>
                                    </select>

                                    <div className="languageHelp">
                                        {preferences.languageMode === "auto" ? (
                                            <>
                                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                                LUMORA will automatically
                                                respond in the language you use.
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-lock"></i>
                                                LUMORA will always reply in
                                                your selected preferred language.
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {settingsError && (
                                <div className="settingsMessage settingsError">
                                    {settingsError}
                                </div>
                            )}

                            {settingsSuccess && (
                                <div className="settingsMessage settingsSuccess">
                                    <i className="fa-solid fa-check-circle"></i>
                                    {settingsSuccess}
                                </div>
                            )}
                        </div>

                        <div className="settingsFooter">
                            <button
                                type="button"
                                className="settingsCancel"
                                onClick={() => setShowSettings(false)}
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="settingsSave"
                                onClick={saveSettings}
                                disabled={
                                    settingsLoading || settingsSaving
                                }
                            >
                                {settingsSaving ? (
                                    "Saving..."
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check"></i>
                                        Save changes
                                    </>
                                )}
                            </button>
                        </div>
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
