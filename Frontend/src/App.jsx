
import "./App.css";

import {
    useState,
    useEffect,
    useCallback,
    useMemo
} from "react";

import { v4 as uuidv4 } from "uuid";

import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function App() {
    // Chat state
    const [prompt, setPrompt] = useState("");
    const [reply, setReply] = useState(null);

    // Thread state
    const [currThreadId, setCurrThreadId] = useState(() => uuidv4());
    const [prevChats, setPrevChats] = useState([]);
    const [allThreads, setAllThreads] = useState([]);

    // UI state
    const [newChat, setNewChat] = useState(true);
    const [loadingThreads, setLoadingThreads] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all conversations
    const fetchThreads = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/thread`);

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

    // Fetch history once when the application starts
    useEffect(() => {
        fetchThreads();
    }, [fetchThreads]);

    // Start a new conversation
    const createNewChat = useCallback(() => {
        setCurrThreadId(uuidv4());
        setPrevChats([]);
        setPrompt("");
        setReply(null);
        setNewChat(true);
    }, []);

    // Shared context
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
        createNewChat
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
        createNewChat
    ]);

    return (
        <div className="app">
            <MyContext.Provider value={providerValues}>
                <Sidebar />
                <ChatWindow />
            </MyContext.Provider>
        </div>
    );
}

export default App;
