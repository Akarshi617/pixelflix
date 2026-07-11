import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function AuthModal({ mode: initialMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { signUp, logIn } = useAuth();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signup") {
        signUp(email, password);
      } else {
        logIn(email, password);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h2>{mode === "signup" ? "Create your account" : "Sign in"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
          />

          {error && <p className="modal-error">{error}</p>}

          <button type="submit">{mode === "signup" ? "Sign Up" : "Sign In"}</button>
        </form>

        <p className="modal-switch">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button type="button" onClick={() => setMode("signup")}>
                Create an account
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
