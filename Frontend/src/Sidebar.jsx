
import "./Sidebar.css";

import { useContext, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import SparkleIcon from "./SparkleIcon.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function Sidebar() {
    const {
        allThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats,
        fetchThreads,
        createNewChat
    } = useContext(MyContext);

    const [loadingThread, setLoadingThread] = useState(false);
    const [deletingThread, setDeletingThread] = useState(null);
    const [error, setError] = useState("");

    // Open an existing conversation
    const changeThread = async (threadId) => {
        if (threadId === currThreadId || loadingThread) return;

        try {
            setLoadingThread(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/thread/${threadId}`
            );

            if (!response.ok) {
                throw new Error("Failed to load conversation");
            }

            const messages = await response.json();

            setCurrThreadId(threadId);
            setPrevChats(messages);
            setPrompt("");
            setReply(null);
            setNewChat(false);

        } catch (err) {
            console.error("Change Thread Error:", err);
            setError(err.message);

        } finally {
            setLoadingThread(false);
        }
    };

    // Delete a conversation
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
                { method: "DELETE" }
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

    return (
        <aside className="sidebar">

            {/* Sidebar header */}
            <div className="sidebarHeader">
                <div className="sidebarBrand">
                    <span className="sidebarBrandIcon">
                        <SparkleIcon size={23} />
                    </span>

                    <span>LUMORA</span>
                </div>

                <button
                    className="sidebarHeaderButton"
                    onClick={createNewChat}
                    title="New chat"
                    aria-label="New chat"
                >
                    <i className="fa-regular fa-pen-to-square"></i>
                </button>
            </div>

            {/* Main navigation */}
            <nav className="sidebarNavigation">

                <button
                    className="sidebarNavItem activeNavItem"
                    onClick={createNewChat}
                >
                    <i className="fa-regular fa-pen-to-square"></i>
                    <span>New chat</span>
                </button>

                <button
                    className="sidebarNavItem"
                    onClick={() => {
                        const history = document.querySelector(
                            ".historyContainer"
                        );

                        history?.scrollIntoView({ behavior: "smooth" });
                    }}
                >
                    <i className="fa-regular fa-clock"></i>
                    <span>Recent chats</span>
                </button>

                <button
                    className="sidebarNavItem"
                    type="button"
                    title="Projects are coming soon"
                    disabled
                >
                    <i className="fa-solid fa-folder-open"></i>
                    <span>Projects</span>
                    <span className="comingSoon">Soon</span>
                </button>

                <button
                    className="sidebarNavItem"
                    type="button"
                    title="Explore features coming soon"
                    disabled
                >
                    <i className="fa-solid fa-compass"></i>
                    <span>Explore</span>
                    <span className="comingSoon">Soon</span>
                </button>

            </nav>

            {/* Projects section */}
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

            {/* Recent conversations */}
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

            {/* Fixed profile footer */}
            <div className="sidebarProfile">
                <div className="profileAvatar">S</div>

                <div className="profileDetails">
                    <strong>My Account</strong>
                    <span>LUMORA User</span>
                </div>

                <button
                    className="profileMore"
                    title="Account options"
                    type="button"
                >
                    <i className="fa-solid fa-ellipsis"></i>
                </button>
            </div>

        </aside>
    );
}

export default Sidebar;
