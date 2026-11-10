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
      setValidationError("El nombre de usuario es obligatorio.");
      return false;
    }
    if (trimmedUser.length < 3 || trimmedUser.length > 30) {
      setValidationError("El usuario debe tener entre 3 y 30 caracteres.");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUser)) {
      setValidationError("Solo se permiten letras, números y guión bajo (_).");
      return false;
    }
    if (!password) {
      setValidationError("La contraseña es obligatoria.");
      return false;
    }
    if (password.length < 6) {
      setValidationError("La contraseña debe tener al menos 6 caracteres.");
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
          <button className="auth-close-btn" onClick={onClose} aria-label="Cerrar modal">
            &times;
          </button>
        )}

        <div className="auth-header">
          <div className="auth-badge">IDENTITY ACCESS</div>
          <h2 id="auth-modal-title">
            {tab === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </h2>
          <p className="auth-subtitle">
            {tab === "login"
              ? "Ingresa tus credenciales para competir y guardar tus mejores marcas."
              : "Registra tu usuario único para registrar tus récords en el test de reacción."}
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
            Ingresar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "register"}
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => handleTabChange("register")}
          >
            Registro
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
              Usuario único <span className="req">*</span>
            </label>
            <input
              id="auth-username"
              type="text"
              autoComplete="username"
              placeholder="Ej. CyberSniper_01"
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
            <small className="field-hint">Mínimo 3 caracteres. Letras, números y _</small>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">
              Contraseña <span className="req">*</span>
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
            <small className="field-hint">Mínimo 6 caracteres</small>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting}
          >
            {submitting
              ? "Procesando..."
              : tab === "login"
              ? "Acceder a la Arena"
              : "Completar Registro"}
          </button>
        </form>

        <div className="auth-footer-note">
          <span>Solo usuarios registrados pueden disparar y registrar tiempos. Los visitantes solo pueden consultar el Top Ranking.</span>
        </div>
      </div>
    </div>
  );
}
