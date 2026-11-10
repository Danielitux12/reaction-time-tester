import { useState } from "react";
import "./EscMenu.css";
import type { ShooterSettings } from "./types";
import { DIFFICULTY_LEVELS, difficultyConfig, type Difficulty } from "../../config/difficulty";
import Leaderboard from "../../components/leaderboard/Leaderboard";

type EscMenuProps = {
  isOpen: boolean;
  onResume: () => void;
  onReset: () => void;
  onExit: () => void;
  settings: ShooterSettings;
  onSettingsChange: (newSettings: ShooterSettings) => void;
  difficulty: Difficulty;
  onDifficultyChange: (newDiff: Difficulty) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  username: string | null;
  onLogout: () => void;
};

export default function EscMenu({
  isOpen,
  onResume,
  onReset,
  onExit,
  settings,
  onSettingsChange,
  difficulty,
  onDifficultyChange,
  isFullscreen,
  onToggleFullscreen,
  username,
  onLogout,
}: EscMenuProps) {
  const [activeTab, setActiveTab] = useState<"resume" | "settings" | "leaderboard">("resume");

  if (!isOpen) return null;

  const updateSetting = <K extends keyof ShooterSettings>(key: K, value: ShooterSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onSettingsChange(updated);
  };

  return (
    <div className="esc-menu-overlay" role="dialog" aria-modal="true" aria-label="Menú de Pausa">
      <div className="esc-menu-container">
        {/* Header */}
        <div className="esc-header">
          <div className="esc-title-group">
            <span className="esc-badge">SISTEMA PAUSADO</span>
            <h2>MENÚ DE OPERACIONES</h2>
          </div>
          {username && (
            <div className="esc-user-badge">
              <span className="user-indicator" />
              <span>Agente: <b>{username}</b></span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="esc-tabs">
          <button
            type="button"
            className={`esc-tab ${activeTab === "resume" ? "active" : ""}`}
            onClick={() => setActiveTab("resume")}
          >
            ▶ Reanudar
          </button>
          <button
            type="button"
            className={`esc-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙ Ajustes
          </button>
          <button
            type="button"
            className={`esc-tab ${activeTab === "leaderboard" ? "active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            🏆 Top Ranking
          </button>
        </nav>

        {/* Tab Contents */}
        <div className="esc-tab-content">
          {/* TAB 1: RESUME */}
          {activeTab === "resume" && (
            <div className="esc-pane resume-pane">
              <p className="resume-intro">
                El entrenamiento está en pausa. Tu ángulo de mira y objetivos en la arena se mantienen congelados.
              </p>

              <div className="resume-actions">
                <button type="button" className="esc-btn primary-btn" onClick={onResume}>
                  <span>▶ CONTINUAR PARTIDA</span>
                  <kbd>ESC</kbd>
                </button>

                <button type="button" className="esc-btn secondary-btn" onClick={onReset}>
                  <span>↻ Reiniciar Ronda Actual</span>
                </button>

                <button type="button" className="esc-btn danger-btn" onClick={onExit}>
                  <span>✖ Salir al Vestíbulo</span>
                </button>
              </div>

              <div className="esc-info-box">
                <h4>CONTROLES RÁPIDOS</h4>
                <ul>
                  <li><b>Mover Mouse</b>: Apuntar a los objetivos en la arena.</li>
                  <li><b>Click Izquierdo</b>: Disparo directo desde el centro.</li>
                  <li><b>ESC</b>: Alternar este menú de pausa.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {activeTab === "settings" && (
            <div className="esc-pane settings-pane">
              {/* Sensibilidad */}
              <div className="setting-group">
                <div className="setting-label-row">
                  <label htmlFor="sens-slider">Sensibilidad del Mouse</label>
                  <span className="setting-val">{settings.sensitivity.toFixed(2)}x</span>
                </div>
                <input
                  id="sens-slider"
                  type="range"
                  min="0.2"
                  max="3.5"
                  step="0.05"
                  value={settings.sensitivity}
                  onChange={(e) => updateSetting("sensitivity", parseFloat(e.target.value))}
                />
                <small className="setting-desc">Ajusta la velocidad de puntería y movimiento de cámara.</small>
              </div>

              {/* Invertir Y */}
              <div className="setting-group-inline">
                <div>
                  <label htmlFor="invert-y-chk">Invertir Eje Y</label>
                  <small className="setting-desc">Invierte la dirección vertical al mover el ratón arriba/abajo.</small>
                </div>
                <input
                  id="invert-y-chk"
                  type="checkbox"
                  checked={settings.invertY}
                  onChange={(e) => updateSetting("invertY", e.target.checked)}
                />
              </div>

              {/* Estilo de Mira */}
              <div className="setting-group">
                <label>Estilo de la Mira (Punta Central)</label>
                <div className="options-row">
                  {(["cross", "dot", "circle"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={`option-btn ${settings.crosshairStyle === style ? "active" : ""}`}
                      onClick={() => updateSetting("crosshairStyle", style)}
                    >
                      {style === "cross" ? "+ Cruz Táctica" : style === "dot" ? "• Punto de Precisión" : "◎ Círculo y Punto"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color de Mira */}
              <div className="setting-group">
                <label>Color de la Mira</label>
                <div className="colors-row">
                  {[
                    { label: "Verde Táctico", color: "#00ff66" },
                    { label: "Verde Esmeralda", color: "#10b981" },
                    { label: "Amarillo Eléctrico", color: "#ffe600" },
                    { label: "Rojo Escarlata", color: "#ff2a5f" },
                    { label: "Blanco Puro", color: "#ffffff" },
                    { label: "Cian Neón", color: "#00f0ff" },
                  ].map(({ label, color }) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-pick-btn ${settings.crosshairColor === color ? "active" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateSetting("crosshairColor", color)}
                      title={label}
                    />
                  ))}
                </div>
              </div>

              {/* Sonido */}
              <div className="setting-group">
                <div className="setting-label-row">
                  <label htmlFor="sound-vol">Volumen de Efectos</label>
                  <span className="setting-val">{settings.soundEnabled ? `${Math.round(settings.volume * 100)}%` : "Silenciado"}</span>
                </div>
                <div className="slider-with-toggle">
                  <input
                    id="sound-vol"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.volume}
                    disabled={!settings.soundEnabled}
                    onChange={(e) => updateSetting("volume", parseFloat(e.target.value))}
                  />
                  <button
                    type="button"
                    className={`toggle-icon-btn ${settings.soundEnabled ? "on" : "off"}`}
                    onClick={() => updateSetting("soundEnabled", !settings.soundEnabled)}
                  >
                    {settings.soundEnabled ? "🔊 ON" : "🔇 MUTE"}
                  </button>
                </div>
              </div>

              {/* Dificultad */}
              <div className="setting-group">
                <label>Dificultad de la Prueba</label>
                <div className="options-row">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`option-btn ${difficulty === level ? "active" : ""}`}
                      onClick={() => onDifficultyChange(level)}
                    >
                      {difficultyConfig[level].label}
                    </button>
                  ))}
                </div>
                <small className="setting-desc">{difficultyConfig[difficulty].description}</small>
              </div>

              {/* Pantalla Completa */}
              <div className="setting-group-inline">
                <div>
                  <label>Pantalla Completa</label>
                  <small className="setting-desc">Maximiza la inmersión visual y fija el puntero al centro.</small>
                </div>
                <button type="button" className="esc-btn-small" onClick={onToggleFullscreen}>
                  {isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div className="esc-pane leaderboard-pane">
              <Leaderboard />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="esc-footer">
          <button type="button" className="esc-btn-link" onClick={onResume}>
            Reanudar (ESC)
          </button>
          {username && (
            <button type="button" className="esc-btn-link text-danger" onClick={onLogout}>
              Cerrar Sesión ({username})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
