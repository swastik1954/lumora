
import "./Sidebar.css";

import { useContext, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import SparkleIcon from "./SparkleIcon.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function Sidebar({ isOpen = false, onClose = () => {} }) {
    const {
        allThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats,
        fetchThreads,
        createNewChat,
        user
    } = useContext(MyContext);

    const [loadingThread, setLoadingThread] = useState(false);
    const [deletingThread, setDeletingThread] = useState(null);
    const [error, setError] = useState("");

    // Create new conversation
    const handleNewChat = () => {
        createNewChat();
        onClose();
    };

    // Load existing conversation
    const changeThread = async (threadId) => {
        if (threadId === currThreadId || loadingThread) {
            onClose();
            return;
        }

        try {
            setLoadingThread(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/thread/${threadId}`,
                { credentials: "include" }
            );

            if (response.status === 401) {
                throw new Error(
                    "Your session has expired. Please sign in again."
                );
            }

            if (!response.ok) {
                throw new Error("Failed to load conversation");
            }

            const messages = await response.json();

            setCurrThreadId(threadId);
            setPrevChats(messages);
            setPrompt("");
            setReply(null);
            setNewChat(false);

            onClose();
        } catch (err) {
            console.error("Change Thread Error:", err);
            setError(err.message);
        } finally {
            setLoadingThread(false);
        }
    };

    // Delete conversation
    const deleteThread = async (e, threadId) => {
        e.stopPropagation();

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this conversation?"
        );

        if (!confirmDelete) return;

        try {
            setDeletingThread(threadId);
            setError("");

            const response = await fetch(
                `${API_URL}/api/thread/${threadId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to delete conversation"
                );
            }

            if (fetchThreads) {
                await fetchThreads();
            }

            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.error("Delete Thread Error:", err);
            setError(err.message);
        } finally {
            setDeletingThread(null);
        }
    };

    const displayName = user?.name || "My Account";
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <button
                    type="button"
                    className="mobileSidebarBackdrop"
                    onClick={onClose}
                    aria-label="Close navigation menu"
                />
            )}

            {/* Original LUMORA Sidebar */}
            <aside className={`sidebar ${isOpen ? "sidebarOpen" : ""}`}>

                {/* Sidebar Header */}
                <div className="sidebarHeader">
                    <div className="sidebarBrand">
                        <span className="sidebarBrandIcon">
                            <SparkleIcon size={23} />
                        </span>

                        <span>LUMORA</span>
                    </div>

                    <div className="sidebarHeaderActions">
                        <button
                            type="button"
                            className="mobileSidebarClose"
                            onClick={onClose}
                            aria-label="Close sidebar"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        <button
                            type="button"
                            className="sidebarHeaderButton"
                            onClick={handleNewChat}
                            title="New chat"
                            aria-label="New chat"
                        >
                            <i className="fa-regular fa-pen-to-square"></i>
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="sidebarNavigation">
                    <button
                        type="button"
                        className="sidebarNavItem activeNavItem"
                        onClick={handleNewChat}
                    >
                        <i className="fa-regular fa-pen-to-square"></i>
                        <span>New chat</span>
                    </button>

                    <button
                        type="button"
                        className="sidebarNavItem"
                        onClick={() => {
                            document.querySelector(".historyContainer")
                                ?.scrollIntoView({ behavior: "smooth" });
                        }}
                    >
                        <i className="fa-regular fa-clock"></i>
                        <span>Recent chats</span>
                    </button>

                    <button
                        type="button"
                        className="sidebarNavItem"
                        title="Projects are coming soon"
                        disabled
                    >
                        <i className="fa-solid fa-folder-open"></i>
                        <span>Projects</span>
                        <span className="comingSoon">Soon</span>
                    </button>

                    <button
                        type="button"
                        className="sidebarNavItem"
                        title="Explore features coming soon"
                        disabled
                    >
                        <i className="fa-solid fa-compass"></i>
                        <span>Explore</span>
                        <span className="comingSoon">Soon</span>
                    </button>
                </nav>

                {/* Projects */}
                <div className="sidebarProjects">
                    <div className="sidebarSectionHeading">
                        <span>Projects</span>

                        <button
                            type="button"
                            title="Projects coming soon"
                            disabled
                        >
                            <i className="fa-solid fa-plus"></i>
                        </button>
                    </div>

                    <p className="emptyProjects">No projects yet</p>
                </div>

                {/* Conversation History */}
                <div className="historyContainer">
                    <div className="sidebarSectionHeading">
                        <span>Recents</span>
                    </div>

                    {error && (
                        <p className="sidebarError">{error}</p>
                    )}

                    {loadingThread && (
                        <p className="sidebarStatus">
                            Loading conversation...
                        </p>
                    )}

                    <ul className="history">
                        {allThreads?.map((thread) => (
                            <li
                                key={thread.threadId}
                                onClick={() => changeThread(thread.threadId)}
                                className={
                                    thread.threadId === currThreadId
                                        ? "highlighted"
                                        : ""
                                }
                                title={thread.title || "New Chat"}
                            >
                                <i className="fa-regular fa-message threadIcon"></i>

                                <span className="threadTitle">
                                    {thread.title || "New Chat"}
                                </span>

                                <button
                                    type="button"
                                    className="deleteBtn"
                                    title="Delete conversation"
                                    aria-label="Delete conversation"
                                    disabled={
                                        deletingThread === thread.threadId
                                    }
                                    onClick={(e) =>
                                        deleteThread(e, thread.threadId)
                                    }
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {allThreads?.length === 0 && !loadingThread && (
                        <p className="sidebarStatus">
                            Your conversations will appear here.
                        </p>
                    )}
                </div>

                {/* User Profile */}
                <div className="sidebarProfile">
                    <div className="profileAvatar">{initial}</div>

                    <div className="profileDetails">
                        <strong>{displayName}</strong>
                        <span>{user?.email || "LUMORA User"}</span>
                    </div>

                    <span className="profileMore" title="Signed in">
                        <i className="fa-solid fa-circle-check"></i>
                    </span>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
