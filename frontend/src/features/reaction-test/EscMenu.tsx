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
    <div className="esc-menu-overlay" role="dialog" aria-modal="true" aria-label="Pause Menu">
      <div className="esc-menu-container">
        {/* Header */}
        <div className="esc-header">
          <div className="esc-title-group">
            <span className="esc-badge">SYSTEM PAUSED</span>
            <h2>OPERATIONS MENU</h2>
          </div>
          {username && (
            <div className="esc-user-badge">
              <span className="user-indicator" />
              <span>Operator: <b>{username}</b></span>
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
            ▶ Resume
          </button>
          <button
            type="button"
            className={`esc-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙ Settings
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
                Training is paused. Your crosshair angle and arena targets remain frozen.
              </p>

              <div className="resume-actions">
                <button type="button" className="esc-btn primary-btn" onClick={onResume}>
                  <span>▶ RESUME ROUND</span>
                  <kbd>ESC</kbd>
                </button>

                <button type="button" className="esc-btn secondary-btn" onClick={onReset}>
                  <span>↻ Restart Current Round</span>
                </button>

                <button type="button" className="esc-btn danger-btn" onClick={onExit}>
                  <span>✖ Exit to Lobby</span>
                </button>
              </div>

              <div className="esc-info-box">
                <h4>QUICK CONTROLS</h4>
                <ul>
                  <li><b>Move Mouse</b>: Aim at targets in the arena.</li>
                  <li><b>Left Click</b>: Fire direct shot from crosshair center.</li>
                  <li><b>ESC</b>: Toggle this pause menu.</li>
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
                  <label htmlFor="sens-slider">Mouse Sensitivity</label>
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
                <small className="setting-desc">Adjust aiming speed and camera responsiveness.</small>
              </div>

              {/* Invertir Y */}
              <div className="setting-group-inline">
                <div>
                  <label htmlFor="invert-y-chk">Invert Y Axis</label>
                  <small className="setting-desc">Inverts vertical pitch when moving mouse up/down.</small>
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
                <label>Crosshair Style</label>
                <div className="options-row">
                  {(["cross", "dot", "circle"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={`option-btn ${settings.crosshairStyle === style ? "active" : ""}`}
                      onClick={() => updateSetting("crosshairStyle", style)}
                    >
                      {style === "cross" ? "+ Tactical Cross" : style === "dot" ? "• Precision Dot" : "◎ Circle & Dot"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color de Mira */}
              <div className="setting-group">
                <label>Crosshair Color</label>
                <div className="colors-row">
                  {[
                    { label: "Tactical Green", color: "#00ff66" },
                    { label: "Emerald Green", color: "#10b981" },
                    { label: "Electric Yellow", color: "#ffe600" },
                    { label: "Scarlet Red", color: "#ff2a5f" },
                    { label: "Pure White", color: "#ffffff" },
                    { label: "Neon Cyan", color: "#00f0ff" },
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
                  <label htmlFor="sound-vol">Sound Effects Volume</label>
                  <span className="setting-val">{settings.soundEnabled ? `${Math.round(settings.volume * 100)}%` : "Muted"}</span>
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
                <label>Test Difficulty</label>
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
                  <label>Full Screen</label>
                  <small className="setting-desc">Maximize immersion and lock mouse cursor to center.</small>
                </div>
                <button type="button" className="esc-btn-small" onClick={onToggleFullscreen}>
                  {isFullscreen ? "Exit Full Screen" : "Full Screen"}
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
            Resume (ESC)
          </button>
          {username && (
            <button type="button" className="esc-btn-link text-danger" onClick={onLogout}>
              Sign Out ({username})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
