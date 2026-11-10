import { useState } from "react";
import "./AuthModal.css";

type AuthModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  onLogin: (user: string, pass: string) => Promise<boolean>;
  onRegister: (user: string, pass: string) => Promise<boolean>;
  error: string | null;
  onClearError: () => void;
};

export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  error,
  onClearError,
}: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setValidationError("Username is required.");
      return false;
    }
    if (trimmedUser.length < 3 || trimmedUser.length > 30) {
      setValidationError("Username must be between 3 and 30 characters.");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUser)) {
      setValidationError("Only letters, numbers, and underscores (_) are allowed.");
      return false;
    }
    if (!password) {
      setValidationError("Password is required.");
      return false;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (tab === "login") {
        await onLogin(username.trim(), password);
      } else {
        await onRegister(username.trim(), password);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (nextTab: "login" | "register") => {
    setTab(nextTab);
    setValidationError(null);
    onClearError();
  };

  return (
    <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="auth-card">
        {onClose && (
          <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        )}

        <div className="auth-header">
          <div className="auth-badge">IDENTITY ACCESS</div>
          <h2 id="auth-modal-title">
            {tab === "login" ? "Sign In" : "Create Account"}
          </h2>
          <p className="auth-subtitle">
            {tab === "login"
              ? "Enter your credentials to compete and save your best records."
              : "Register your unique username to record your reaction test times."}
          </p>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "login"}
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => handleTabChange("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "register"}
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => handleTabChange("register")}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {(validationError || error) && (
            <div className="auth-alert" role="alert">
              <span className="auth-alert-icon">⚠</span>
              <span>{validationError || error}</span>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-username">
              Username <span className="req">*</span>
            </label>
            <input
              id="auth-username"
              type="text"
              autoComplete="username"
              placeholder="e.g. CyberSniper_01"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setValidationError(null);
                onClearError();
              }}
              required
              minLength={3}
              maxLength={30}
              disabled={submitting}
            />
            <small className="field-hint">Minimum 3 characters. Letters, numbers, and _</small>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">
              Password <span className="req">*</span>
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationError(null);
                onClearError();
              }}
              required
              minLength={6}
              disabled={submitting}
            />
            <small className="field-hint">Minimum 6 characters</small>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting}
          >
            {submitting
              ? "Processing..."
              : tab === "login"
              ? "Enter Arena"
              : "Complete Registration"}
          </button>
        </form>

        <div className="auth-footer-note">
          <span>Only registered users can shoot and record times. Guests can browse the Top Leaderboard.</span>
        </div>
      </div>
    </div>
  );
}
