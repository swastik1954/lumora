
import "./auth.css";
import { useState } from "react";
import SparkleIcon from "./SparkleIcon.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function Auth({ onAuthenticated }) {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        setError("");
        setLoading(true);

        try {
            const endpoint = isLogin ? "login" : "signup";

            const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    isLogin
                        ? { email, password }
                        : { name, email, password }
                )
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            onAuthenticated(data.user);
        } catch (err) {
            console.error("Authentication error:", err);
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin((previous) => !previous);
        setError("");
        setPassword("");
    };

    return (
        <main className="authPage">
            <div className="authGlow"></div>

            <div className="authCard">
                <div className="authBrand">
                    <span className="authLogo">
                        <SparkleIcon size={27} />
                    </span>
                    <span>LUMORA</span>
                </div>

                <div className="authHeading">
                    <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
                    <p>
                        {isLogin
                            ? "Sign in to continue your conversations."
                            : "Join LUMORA and bring your ideas to life."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="authForm">
                    {!isLogin && (
                        <div className="authField">
                            <label htmlFor="authName">Full name</label>
                            <input
                                id="authName"
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                minLength={2}
                                maxLength={50}
                                autoComplete="name"
                                required
                            />
                        </div>
                    )}

                    <div className="authField">
                        <label htmlFor="authEmail">Email address</label>
                        <input
                            id="authEmail"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="authField">
                        <label htmlFor="authPassword">Password</label>

                        <div className="passwordInput">
                            <input
                                id="authPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                                autoComplete={
                                    isLogin ? "current-password" : "new-password"
                                }
                                required
                            />

                            <button
                                type="button"
                                className="passwordToggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="authError">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="authSubmit"
                        disabled={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : isLogin
                                ? "Sign in"
                                : "Create account"}
                        {!loading && <i className="fa-solid fa-arrow-right"></i>}
                    </button>
                </form>

                <div className="authSwitch">
                    
<button
    type="button"
    className="guestButton"
    onClick={async () => {
        if (loading) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/auth/guest`, {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Unable to continue as guest");
            }

            onAuthenticated(data.user);
        } catch (err) {
            console.error("Guest Login Error:", err);
            setError(err.message || "Unable to start guest session");
        } finally {
            setLoading(false);
        }
    }}
    disabled={loading}
>
    <i className="fa-regular fa-user"></i>
    Continue as Guest
    <i className="fa-solid fa-arrow-right"></i>
</button>

<p className="guestNote">
    No account required. You can sign up later.
</p>

                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button type="button" onClick={switchMode}>
                        {isLogin ? "Sign up" : "Sign in"}
                    </button>
                </div>

                <p className="authFooter">
                    Your ideas deserve a brighter space.
                </p>
            </div>
        </main>
    );
}

export default Auth;
