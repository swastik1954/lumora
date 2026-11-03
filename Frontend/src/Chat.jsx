
import "./Chat.css";

import SparkleIcon from "./SparkleIcon.jsx";

import { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const { newChat, prevChats, reply, setPrompt } = useContext(MyContext);

    const [latestReply, setLatestReply] = useState({
        source: null,
        text: ""
    });

    const suggestions = [
        {
            icon: "fa-solid fa-code",
            title: "Write code",
            description: "Build, debug and understand code",
            prompt: "Help me write a Python program"
        },
        {
            icon: "fa-solid fa-lightbulb",
            title: "Learn something",
            description: "Understand complex topics simply",
            prompt: "Explain artificial intelligence in simple terms"
        },
        {
            icon: "fa-solid fa-pen",
            title: "Improve writing",
            description: "Draft, rewrite and refine ideas",
            prompt: "Help me write a professional email"
        },
        {
            icon: "fa-solid fa-brain",
            title: "Explore ideas",
            description: "Brainstorm something interesting",
            prompt: "Give me some creative project ideas"
        }
    ];

    // Gemini response typing animation
    useEffect(() => {
        if (!reply || typeof reply !== "string") return;

        const words = reply.split(/(\s+)/);
        let index = 0;

        const interval = setInterval(() => {
            index++;

            setLatestReply({
                source: reply,
                text: words.slice(0, index).join("")
            });

            if (index >= words.length) {
                clearInterval(interval);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [reply]);

    // Markdown renderer
    const renderMarkdown = (content) => (
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {content || ""}
        </ReactMarkdown>
    );

    return (
        <div className="chat">

            {/* Welcome screen */}
            {newChat && prevChats.length === 0 && (
                <div className="welcomeScreen">

                    {/* Custom SigmaGPT sparkle logo */}
                    <div className="welcomeIcon">
                        <SparkleIcon size={30} />
                    </div>

                    <h1>Where ideas take flight</h1>

                    <p className="welcomeSubtitle">
                        Ask, explore, and create with your intelligent AI partner.
                    </p>

                    {/* Suggested prompts */}
                    <div className="suggestionGrid">
                        {suggestions.map((item) => (
                            <button
                                className="suggestionCard"
                                key={item.title}
                                onClick={() => setPrompt(item.prompt)}
                            >
                                <span className="suggestionIcon">
                                    <i className={item.icon}></i>
                                </span>

                                <span className="suggestionText">
                                    <strong>{item.title}</strong>
                                    <small>{item.description}</small>
                                </span>

                                <i className="fa-solid fa-arrow-up-right-from-square suggestionArrow"></i>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat history */}
            <div className="chats">
                {prevChats?.map((chat, idx) => {

                    // Hide last assistant message during animation
                    if (
                        reply !== null &&
                        idx === prevChats.length - 1 &&
                        chat.role === "assistant"
                    ) {
                        return null;
                    }

                    return (
                        <div
                            className={
                                chat.role === "user"
                                    ? "userDiv"
                                    : "gptDiv"
                            }
                            key={`${idx}-${chat.role}`}
                        >
                            {chat.role === "user" ? (
                                <p className="userMessage">
                                    {chat.content}
                                </p>
                            ) : (
                                renderMarkdown(chat.content)
                            )}
                        </div>
                    );
                })}

                {/* Animated latest Gemini response */}
                {reply !== null && (
                    <div className="gptDiv latestReply">
                        {renderMarkdown(
                            latestReply.source === reply
                                ? latestReply.text
                                : ""
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}

export default Chat;
