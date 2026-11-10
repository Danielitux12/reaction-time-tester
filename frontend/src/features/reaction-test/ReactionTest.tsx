import { useCallback, useEffect, useRef, useState } from "react";
import "./ReactionTest.css";
import { DIFFICULTY_LEVELS, difficultyConfig, type Difficulty } from "../../config/difficulty";
import { saveScore } from "../../services/scoreService";
import { DEFAULT_SETTINGS, type GameState, type ShooterSettings } from "./types";
import ShooterArena from "./ShooterArena";
import Crosshair from "./Crosshair";
import EscMenu from "./EscMenu";
import AuthModal from "../../components/auth/AuthModal";
import { useAuthController } from "../../controllers/useAuthController";
import { soundManager } from "./soundEffects";

const MIN_DELAY = 1000;
const MAX_DELAY = 3200;

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

export default function ReactionTest() {
  // Auth controller
  const auth = useAuthController();

  // Game state
  const [state, setState] = useState<GameState>("idle");
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [showEscMenu, setShowEscMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Settings
  const [settings, setSettings] = useState<ShooterSettings>(() => {
    try {
      const saved = localStorage.getItem("rtm_shooter_settings");
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Crosshair feedback
  const [recoilActive, setRecoilActive] = useState(false);
  const [hitMarkerActive, setHitMarkerActive] = useState(false);

  // Refs
  const stateRef = useRef<GameState>("idle");
  const difficultyRef = useRef<Difficulty>(1);
  const startTimeRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const revealDeadlineRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef<number | null>(null);
  const autoRetryTimeoutRef = useRef<number | null>(null);
  const recoilTimerRef = useRef<number | null>(null);
  const hitMarkerTimerRef = useRef<number | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);

  // Update setting and persist to localStorage
  const handleSettingsChange = (newSettings: ShooterSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem("rtm_shooter_settings", JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  };

  const setGameState = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearRevealTimeout = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const clearAutoRetry = useCallback(() => {
    if (autoRetryTimeoutRef.current !== null) {
      window.clearTimeout(autoRetryTimeoutRef.current);
      autoRetryTimeoutRef.current = null;
    }
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const el = shellRef.current || document.documentElement;
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Request pointer lock
  const lockPointer = useCallback(() => {
    const playArea = document.querySelector(".arena-container") as HTMLElement | null;
    if (playArea && !document.pointerLockElement) {
      try {
        playArea.requestPointerLock();
      } catch {
        // ignore
      }
    }
  }, []);

  // Target reveal handler
  const revealRound = useCallback(() => {
    startTimeRef.current = performance.now();
    setGameState("target");
    revealTimeoutRef.current = null;
    revealDeadlineRef.current = null;
    pausedRemainingRef.current = null;
  }, [setGameState]);

  // Start round
  const startRound = useCallback(() => {
    if (!auth.isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    clearRevealTimeout();
    clearAutoRetry();
    startTimeRef.current = null;
    pausedRemainingRef.current = null;
    setShowEscMenu(false);
    setGameState("waiting");

    soundManager.playReadySound();
    lockPointer();

    const delay = Math.round(randomBetween(MIN_DELAY, MAX_DELAY));
    revealDeadlineRef.current = performance.now() + delay;
    revealTimeoutRef.current = window.setTimeout(revealRound, delay);
  }, [auth.isAuthenticated, clearAutoRetry, clearRevealTimeout, lockPointer, revealRound, setGameState]);

  // Pause game and open ESC Menu
  const pauseGame = useCallback(() => {
    if (stateRef.current === "waiting" && revealTimeoutRef.current !== null) {
      pausedRemainingRef.current = revealDeadlineRef.current === null
        ? 1000
        : Math.max(0, revealDeadlineRef.current - performance.now());
      clearRevealTimeout();
      revealDeadlineRef.current = null;
    }

    setShowEscMenu(true);
  }, [clearRevealTimeout]);

  // Resume game from ESC Menu
  const resumeGame = useCallback(() => {
    setShowEscMenu(false);
    lockPointer();

    if (stateRef.current === "waiting") {
      const remaining = pausedRemainingRef.current ?? 1000;
      revealDeadlineRef.current = performance.now() + remaining;
      revealTimeoutRef.current = window.setTimeout(revealRound, remaining);
    }
  }, [lockPointer, revealRound]);

  // Reset
  const resetGame = useCallback(() => {
    clearRevealTimeout();
    clearAutoRetry();
    startTimeRef.current = null;
    pausedRemainingRef.current = null;
    revealDeadlineRef.current = null;
    setLastTime(null);
    setBestTime(null);
    setAttempts(0);
    setShowEscMenu(false);
    setGameState("idle");
  }, [clearAutoRetry, clearRevealTimeout, setGameState]);

  // Premature shot penalty
  const handlePrematureShot = useCallback(() => {
    clearRevealTimeout();
    setAttempts((val) => val + 1);
    setLastTime(null);
    setGameState("tooSoon");

    clearAutoRetry();
    autoRetryTimeoutRef.current = window.setTimeout(() => {
      autoRetryTimeoutRef.current = null;
      startRound();
    }, 1200);
  }, [clearAutoRetry, clearRevealTimeout, setGameState, startRound]);

  // Recoil visual trigger
  const handleRecoilTriggered = useCallback(() => {
    setRecoilActive(true);
    if (recoilTimerRef.current !== null) clearTimeout(recoilTimerRef.current);
    recoilTimerRef.current = window.setTimeout(() => {
      setRecoilActive(false);
    }, 80);
  }, []);

  // Hit target
  const handleTargetHit = useCallback((_targetId: number, remainingTargets: number) => {
    setHitMarkerActive(true);
    if (hitMarkerTimerRef.current !== null) clearTimeout(hitMarkerTimerRef.current);
    hitMarkerTimerRef.current = window.setTimeout(() => {
      setHitMarkerActive(false);
    }, 160);

    // If all targets destroyed in this round, round complete!
    if (remainingTargets === 0 && startTimeRef.current !== null) {
      const elapsed = performance.now() - startTimeRef.current;
      const rounded = Math.max(1, Math.round(elapsed));
      const nextAttempts = attempts + 1;

      setLastTime(rounded);
      setBestTime((cur) => (cur === null || rounded < cur ? rounded : cur));
      setAttempts(nextAttempts);
      setGameState("result");

      // Save score to backend with identity
      if (auth.isAuthenticated) {
        saveScore({
          difficulty: difficultyRef.current,
          timeMs: rounded,
          attempts: nextAttempts,
        }).catch(() => {
          // offline support
        });
      }
    }
  }, [attempts, auth.isAuthenticated, setGameState]);

  // Pointer lock change callback
  const handlePointerLockChange = useCallback((locked: boolean) => {
    setIsPointerLocked(locked);

    // If pointer lock was lost while playing, auto-pause with ESC menu!
    if (!locked && (stateRef.current === "waiting" || stateRef.current === "target")) {
      pauseGame();
    }
  }, [pauseGame]);

  // Keyboard shortcut listener: ESC to pause/resume, SPACE to start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showEscMenu) {
          resumeGame();
        } else if (stateRef.current === "waiting" || stateRef.current === "target") {
          pauseGame();
        }
        return;
      }

      if (e.code === "Space" && !showEscMenu && !showAuthModal) {
        if (stateRef.current !== "waiting" && stateRef.current !== "target") {
          e.preventDefault();
          startRound();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pauseGame, resumeGame, showAuthModal, showEscMenu, startRound]);

  const changeDifficulty = (newDiff: Difficulty) => {
    difficultyRef.current = newDiff;
    setDifficulty(newDiff);
    if (stateRef.current !== "idle") resetGame();
  };

  const statusText: Record<GameState, string> = {
    idle: "Ready to shoot",
    waiting: "GET READY · Do not shoot yet",
    target: "SHOOT THE TARGETS!",
    tooSoon: "TOO EARLY (Fault)",
    result: "ROUND COMPLETED",
  };

  return (
    <div ref={shellRef} className={`reaction-shell ${isFullscreen ? "is-fullscreen" : ""}`}>
      {/* Top Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">🎯</div>
          <div>
            <p className="eyebrow">TACTICAL CHALLENGE</p>
            <h1>Reaction Time Test</h1>
          </div>
        </div>

        <div className={`status-badge status-${state}`} aria-live="polite">
          <span className="status-dot" />
          <span className="status-label-text">{statusText[state]}</span>
        </div>

        {/* Identity & Profile Bar */}
        <div className="auth-status-bar">
          {auth.isAuthenticated ? (
            <div className="user-logged-box">
              <span className="user-online-dot" />
              <span className="user-name-text"><b>{auth.username}</b></span>
              <button
                type="button"
                className="header-action-btn"
                onClick={() => setShowEscMenu(true)}
                title="Open menu and settings"
              >
                ⚙ Menu (ESC)
              </button>
              <button
                type="button"
                className="header-logout-btn"
                onClick={auth.logout}
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="user-guest-box">
              <span className="guest-badge">GUEST</span>
              <button
                type="button"
                className="auth-enter-btn"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </button>
            </div>
          )}

          <button
            type="button"
            className="fullscreen-toggle-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
          >
            {isFullscreen ? "🗗" : "🗖"}
          </button>
        </div>
      </header>

      {/* Main Fullscreen Arena Viewport */}
      <main className="arena-viewport-container">
        <div className={`play-area state-${state} ${isPointerLocked ? "is-locked" : ""}`}>
          {/* 3D Viewport */}
          <ShooterArena
            state={state}
            difficulty={difficulty}
            settings={settings}
            isPaused={showEscMenu}
            onTargetHit={handleTargetHit}
            onPrematureShot={handlePrematureShot}
            onPointerLockChange={handlePointerLockChange}
            onRecoilTriggered={handleRecoilTriggered}
          />

          {/* Central Locked Crosshair */}
          <Crosshair
            settings={settings}
            recoil={recoilActive}
            hitMarker={hitMarkerActive}
          />

          {/* Floating In-Game HUD Stats */}
          <aside className="hud-stats-widget" aria-label="Game statistics">
            <div className="hud-stat-pill highlight">
              <span className="hud-stat-label">BEST</span>
              <strong className="hud-stat-value">{bestTime !== null ? `${bestTime} ms` : "—"}</strong>
            </div>
            <div className="hud-stat-pill">
              <span className="hud-stat-label">LAST</span>
              <strong className="hud-stat-value">{lastTime !== null ? `${lastTime} ms` : "—"}</strong>
            </div>
            <div className="hud-stat-pill">
              <span className="hud-stat-label">ATTEMPTS</span>
              <strong className="hud-stat-value">{attempts}</strong>
            </div>
            <div className="hud-stat-pill hide-on-mobile">
              <span className="hud-stat-label">DIFFICULTY</span>
              <strong className="hud-stat-value">{difficultyConfig[difficulty].label}</strong>
            </div>
          </aside>

          {/* Arena HUD Corner info */}
          <div className="arena-hud" aria-hidden="true">
            <span className="hud-corner top-left">TARGET ARENA</span>
            <span className="hud-corner top-right">SENS {settings.sensitivity.toFixed(1)}x</span>
            <span className="hud-center-notice">
              {isPointerLocked ? "Pointer locked · Press ESC for menu" : "Click to aim and shoot"}
            </span>
          </div>

          {/* In-Game Overlay Messages */}
          {state === "idle" && (
            <div className="arena-message" onClick={startRound}>
              <span className="crosshair-large" aria-hidden="true">+</span>
              <strong>REACTION TIME TEST</strong>
              <span>
                {auth.isAuthenticated
                  ? "Click here or press SPACE to start."
                  : "Sign up or log in to save your records."}
              </span>
            </div>
          )}

          {state === "waiting" && (
            <div className="arena-message waiting-message">
              <span className="waiting-line" />
              <strong>GET READY</strong>
              <span>Do not shoot before the target appears</span>
            </div>
          )}

          {state === "tooSoon" && (
            <div className="arena-message error-message">
              <strong>TOO EARLY</strong>
              <span>Penalty fault · Retrying...</span>
            </div>
          )}

          {state === "result" && lastTime !== null && (
            <div className="arena-message result-message" onClick={startRound}>
              <span>REACTION TIME</span>
              <strong>{lastTime}<small> ms</small></strong>
              <span>Click <b>Next round</b> or press SPACE</span>
            </div>
          )}
        </div>

        {/* Bottom Responsive Controls Bar */}
        <div className="arena-bottom-bar">
          <div className="difficulty-switch" role="group" aria-label="Select difficulty">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level}
                className={difficulty === level ? "active" : ""}
                onClick={() => changeDifficulty(level)}
                type="button"
                disabled={state === "waiting" || state === "target"}
              >
                {difficultyConfig[level].label}
              </button>
            ))}
          </div>

          <div className="bottom-actions-group">
            <button
              className="primary-action"
              onClick={startRound}
              type="button"
              disabled={state === "waiting" || state === "target"}
            >
              {auth.isAuthenticated
                ? state === "result" || state === "tooSoon"
                  ? "Next round"
                  : "Start test"
                : "🔒 Sign In to Play"}
              <kbd>SPACE</kbd>
            </button>

            <button
              className="secondary-action"
              onClick={pauseGame}
              type="button"
              title="Menu, settings and Top 100"
            >
              ⚙ Menu / Top
              <kbd>ESC</kbd>
            </button>

            <button
              className="text-action"
              onClick={resetGame}
              type="button"
              title="Reset current session statistics"
            >
              Reset
            </button>
          </div>
        </div>
      </main>

      {/* ESC Menu Modal */}
      <EscMenu
        isOpen={showEscMenu}
        onResume={resumeGame}
        onReset={resetGame}
        onExit={() => {
          resetGame();
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        difficulty={difficulty}
        onDifficultyChange={changeDifficulty}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        username={auth.username}
        onLogout={() => {
          auth.logout();
          resetGame();
        }}
      />

      {/* Identity Registration / Login Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={async (u, p) => {
          const success = await auth.login(u, p);
          if (success) setShowAuthModal(false);
          return success;
        }}
        onRegister={async (u, p) => {
          const success = await auth.register(u, p);
          if (success) setShowAuthModal(false);
          return success;
        }}
        error={auth.error}
        onClearError={auth.clearError}
      />
    </div>
  );
}
