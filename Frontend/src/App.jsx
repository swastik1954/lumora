
import "./App.css";
import { useState, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Auth from "./auth.jsx";
import { MyContext } from "./MyContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function App() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showUpgrade, setShowUpgrade] = useState(false);

    // Mobile sidebar state
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [prompt, setPrompt] = useState("");
    const [reply, setReply] = useState(null);
    const [currThreadId, setCurrThreadId] = useState(() => uuidv4());
    const [prevChats, setPrevChats] = useState([]);
    const [allThreads, setAllThreads] = useState([]);
    const [newChat, setNewChat] = useState(true);
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [error, setError] = useState(null);

    // Fetch conversations belonging to the current user.
    const fetchThreads = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/thread`, {
                credentials: "include"
            });

            if (response.status === 401) {
                setUser(null);
                setAllThreads([]);
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch chat history");
            }

            const data = await response.json();
            setAllThreads(data);
            setError(null);
        } catch (err) {
            console.error("Fetch Threads Error:", err);
            setError(err.message);
        } finally {
            setLoadingThreads(false);
        }
    }, []);

    // Check existing login or guest session.
    useEffect(() => {
        let active = true;

        const checkSession = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    credentials: "include"
                });

                if (!response.ok) {
                    if (active) setUser(null);
                    return;
                }

                const data = await response.json();

                if (active) {
                    setUser(data.user);
                    setLoadingThreads(true);
                    await fetchThreads();
                }
            } catch (err) {
                console.error("Session check failed:", err);
                if (active) setUser(null);
            } finally {
                if (active) setAuthLoading(false);
            }
        };

        checkSession();

        return () => {
            active = false;
        };
    }, [fetchThreads]);

    // Called after login, signup, or guest access.
    const handleAuthenticated = (authenticatedUser) => {
        setUser(authenticatedUser);
        setAllThreads([]);
        setPrevChats([]);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv4());
        setNewChat(true);
        setLoadingThreads(true);
        setShowUpgrade(false);
        setMobileSidebarOpen(false);

        fetchThreads();
    };

    // Called after upgrading a guest account.
    const handleUpgradeComplete = async (updatedUser) => {
        setUser(updatedUser);
        setShowUpgrade(false);
        await fetchThreads();
    };

    // Logout.
    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include"
            });
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setUser(null);
            setAllThreads([]);
            setPrevChats([]);
            setPrompt("");
            setReply(null);
            setCurrThreadId(uuidv4());
            setNewChat(true);
            setShowUpgrade(false);
            setMobileSidebarOpen(false);
            setError(null);
        }
    };

    // Create a new conversation.
    const createNewChat = useCallback(() => {
        setCurrThreadId(uuidv4());
        setPrevChats([]);
        setPrompt("");
        setReply(null);
        setNewChat(true);
        setMobileSidebarOpen(false);
    }, []);

    // Open account upgrade screen.
    const startAccountUpgrade = () => {
        setShowUpgrade(true);
    };

    const providerValues = useMemo(() => ({
        prompt,
        setPrompt,
        reply,
        setReply,
        currThreadId,
        setCurrThreadId,
        newChat,
        setNewChat,
        prevChats,
        setPrevChats,
        allThreads,
        setAllThreads,
        loadingThreads,
        error,
        fetchThreads,
        createNewChat,
        user,
        logout,
        startAccountUpgrade
    }), [
        prompt,
        reply,
        currThreadId,
        newChat,
        prevChats,
        allThreads,
        loadingThreads,
        error,
        fetchThreads,
        createNewChat,
        user
    ]);

    if (authLoading) {
        return (
            <div className="authLoadingScreen">
                <div className="authLoadingLogo">LUMORA</div>
                <p>Preparing your workspace...</p>
            </div>
        );
    }

    // Guest clicks "Save my conversations".
    if (user?.isGuest && showUpgrade) {
        return (
            <Auth
                initialSignup={true}
                onAuthenticated={handleUpgradeComplete}
            />
        );
    }

    // Login or signup screen for users without a session.
    if (!user) {
        return (
            <Auth
                onAuthenticated={handleAuthenticated}
            />
        );
    }

    return (
        <div className="app">
            <MyContext.Provider value={providerValues}>
                <Sidebar
                    isOpen={mobileSidebarOpen}
                    onClose={() => setMobileSidebarOpen(false)}
                />

                <ChatWindow
                    onMenuClick={() => setMobileSidebarOpen(true)}
                />
            </MyContext.Provider>
        </div>
    );
}

export default App;
