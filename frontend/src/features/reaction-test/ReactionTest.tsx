import { useCallback, useEffect, useRef, useState } from "react";
import "./ReactionTest.css";
import ProfileEditor from "../../components/profile/ProfileEditor";
import { DIFFICULTY_LEVELS, difficultyConfig, type Difficulty } from "../../config/difficulty";
import { saveScore } from "../../services/scoreService";
import { validateProfileName } from "../../shared/profile";

type GameState = "idle" | "waiting" | "target" | "tooSoon" | "result";

type Target = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  visible: boolean;
  blink: number;
  speedMul: number;
};

const TARGET_SIZE = 76;
const MIN_DELAY = 900;
const MAX_DELAY = 3600;

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

type ReactionTestProps = {
  onScoreSaved?: () => void;
  profileName: string;
  onProfileNameChange: (value: string) => void;
};

export default function ReactionTest({ onScoreSaved, profileName, onProfileNameChange }: ReactionTestProps) {
  const [state, setState] = useState<GameState>("idle");
  const [lastTime, setLastTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [targets, setTargets] = useState<Target[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  const playRef = useRef<HTMLDivElement | null>(null);
  const targetsRef = useRef<Target[]>([]);
  const stateRef = useRef<GameState>("idle");
  const difficultyRef = useRef<Difficulty>(1);
  const startTimeRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const revealDeadlineRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const autoResetRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef<number | null>(null);

  const setGameState = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const clearRevealTimeout = useCallback(() => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const clearAutoReset = useCallback(() => {
    if (autoResetRef.current !== null) {
      window.clearTimeout(autoResetRef.current);
      autoResetRef.current = null;
    }
  }, []);

  const createTargets = useCallback(() => {
    const play = playRef.current;
    const difficultyValue = difficultyRef.current;
    if (!play) return [];

    const { width, height } = play.getBoundingClientRect();
    const half = TARGET_SIZE / 2;
    const minX = half;
    const minY = half;
    const maxX = Math.max(half, width - half);
    const maxY = Math.max(half, height - half);
    const count = difficultyValue === 1 ? 1 : 3;

    return Array.from({ length: count }, (_, index): Target => {
      const speed = difficultyValue === 1 ? 0 : randomBetween(110, 220);
      let angle = randomBetween(0, Math.PI * 2);

      if (difficultyValue === 2) {
        // Medium moves diagonally toward the lower-left.
        angle = randomBetween((Math.PI * 0.55), (Math.PI * 0.95));
      }

      return {
        id: index + 1,
        x: randomBetween(minX, maxX),
        y: randomBetween(minY, maxY),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        visible: true,
        blink: difficultyValue === 3 ? randomBetween(0.25, 0.8) : Number.POSITIVE_INFINITY,
        speedMul: 1,
      };
    });
  }, []);

  const startAnimation = useCallback(() => {
    stopAnimation();
    let lastTimestamp = performance.now();

    const frame = (timestamp: number) => {
      const play = playRef.current;
      if (!play || stateRef.current !== "target") return;

      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;
      const { width, height } = play.getBoundingClientRect();
      const half = TARGET_SIZE / 2;
      const minX = half;
      const minY = half;
      const maxX = Math.max(half, width - half);
      const maxY = Math.max(half, height - half);
      const difficultyValue = difficultyRef.current;

      const nextTargets = targetsRef.current.map((target) => {
        let { x, y, vx, vy, visible, blink, speedMul } = target;

        if (difficultyValue === 3) {
          blink -= dt;
          if (blink <= 0) {
            visible = !visible;
            blink = randomBetween(0.3, 0.85);
          }
          speedMul = Math.min(2.5, speedMul + dt * 0.18);
        } else {
          visible = true;
          blink = Number.POSITIVE_INFINITY;
        }

        x += vx * speedMul * dt;
        y += vy * speedMul * dt;

        if (difficultyValue === 2) {
          if (x < minX || y > maxY) {
            x = maxX - randomBetween(0, Math.min(100, Math.max(0, maxX - minX)));
            y = minY + randomBetween(0, Math.min(100, Math.max(0, maxY - minY)));
          }
        } else {
          if (x <= minX || x >= maxX) {
            x = Math.max(minX, Math.min(maxX, x));
            vx *= -1;
          }
          if (y <= minY || y >= maxY) {
            y = Math.max(minY, Math.min(maxY, y));
            vy *= -1;
          }
        }

        return { ...target, x, y, vx, vy, visible, blink, speedMul };
      });

      targetsRef.current = nextTargets;
      setTargets(nextTargets);
      animationFrameRef.current = requestAnimationFrame(frame);
    };

    animationFrameRef.current = requestAnimationFrame(frame);
  }, [stopAnimation]);

  const sendScoreToBackend = useCallback(async (time: number, difficultyValue: Difficulty, attemptNumber: number) => {
    try {
      const saved = await saveScore({ player: profileName, difficulty: difficultyValue, timeMs: time, attempts: attemptNumber });
      if (saved) onScoreSaved?.();
    } catch {
      // The tester remains usable when the API is offline.
    }
  }, [onScoreSaved, profileName]);

  const revealRound = useCallback(() => {
    const nextTargets = createTargets();
    targetsRef.current = nextTargets;
    setTargets(nextTargets);
    startTimeRef.current = performance.now();
    setGameState("target");
    revealTimeoutRef.current = null;
    revealDeadlineRef.current = null;
    pausedRemainingRef.current = null;
    startAnimation();
  }, [createTargets, setGameState, startAnimation]);

  const startRound = useCallback(() => {
    clearRevealTimeout();
    clearAutoReset();
    stopAnimation();
    targetsRef.current = [];
    setTargets([]);
    startTimeRef.current = null;
    pausedRemainingRef.current = null;
    setGameState("waiting");

    const delay = Math.round(randomBetween(MIN_DELAY, MAX_DELAY));
    revealDeadlineRef.current = performance.now() + delay;
    revealTimeoutRef.current = window.setTimeout(revealRound, delay);
  }, [clearAutoReset, clearRevealTimeout, revealRound, setGameState, stopAnimation]);

  const reset = useCallback(() => {
    clearRevealTimeout();
    clearAutoReset();
    stopAnimation();
    targetsRef.current = [];
    setTargets([]);
    startTimeRef.current = null;
    pausedRemainingRef.current = null;
    revealDeadlineRef.current = null;
    setLastTime(null);
    setBestTime(null);
    setAttempts(0);
    setShowMenu(false);
    setGameState("idle");
  }, [clearAutoReset, clearRevealTimeout, setGameState, stopAnimation]);

  const queueRetry = useCallback(() => {
    clearAutoReset();
    autoResetRef.current = window.setTimeout(() => {
      autoResetRef.current = null;
      startRound();
    }, 1100);
  }, [clearAutoReset, startRound]);

  const pauseGame = useCallback(() => {
    if (stateRef.current !== "waiting" && stateRef.current !== "target") return;

    if (stateRef.current === "waiting" && revealTimeoutRef.current !== null) {
      pausedRemainingRef.current = revealDeadlineRef.current === null
        ? 1000
        : Math.max(0, revealDeadlineRef.current - performance.now());
      clearRevealTimeout();
      revealDeadlineRef.current = null;
    }

    stopAnimation();
    setShowMenu(true);
  }, [clearRevealTimeout, stopAnimation]);

  const resumeGame = useCallback(() => {
    setShowMenu(false);
    if (stateRef.current === "waiting") {
      const remaining = pausedRemainingRef.current ?? 1000;
      revealDeadlineRef.current = performance.now() + remaining;
      revealTimeoutRef.current = window.setTimeout(revealRound, remaining);
      return;
    }
    if (stateRef.current === "target") startAnimation();
  }, [revealRound, startAnimation]);

  const finishRound = useCallback((time: number) => {
    const roundedTime = Math.max(1, Math.round(time));
    const nextAttempts = attempts + 1;
    setLastTime(roundedTime);
    setBestTime((current) => current === null || roundedTime < current ? roundedTime : current);
    setAttempts(nextAttempts);
    targetsRef.current = [];
    setTargets([]);
    startTimeRef.current = null;
    stopAnimation();
    setGameState("result");
    void sendScoreToBackend(roundedTime, difficultyRef.current, nextAttempts);
  }, [attempts, sendScoreToBackend, setGameState, stopAnimation]);

  const handlePlayAreaClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const currentState = stateRef.current;

    if (currentState === "waiting") {
      clearRevealTimeout();
      stopAnimation();
      setAttempts((value) => value + 1);
      setLastTime(null);
      targetsRef.current = [];
      setTargets([]);
      setGameState("tooSoon");
      queueRetry();
      return;
    }

    if (currentState !== "target" || startTimeRef.current === null) return;

    const play = playRef.current;
    if (!play) return;
    const rect = play.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const hit = targetsRef.current.find((target) => {
      if (!target.visible) return false;
      return Math.hypot(clickX - target.x, clickY - target.y) <= TARGET_SIZE / 2;
    });

    if (!hit) {
      stopAnimation();
      targetsRef.current = [];
      setTargets([]);
      setAttempts((value) => value + 1);
      setGameState("tooSoon");
      queueRetry();
      return;
    }

    const remaining = targetsRef.current.filter((target) => target.id !== hit.id);
    if (remaining.length > 0) {
      targetsRef.current = remaining;
      setTargets(remaining);
      return;
    }

    finishRound(performance.now() - startTimeRef.current);
  };

  const changeDifficulty = (nextDifficulty: Difficulty) => {
    difficultyRef.current = nextDifficulty;
    setDifficulty(nextDifficulty);
    if (stateRef.current !== "idle") reset();
  };

  const profileError = validateProfileName(profileName);
  const profileIsValid = profileError === null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showMenu) {
        resumeGame();
        return;
      }
      if (event.key === "Escape" && (stateRef.current === "waiting" || stateRef.current === "target")) {
        pauseGame();
        return;
      }
      if (event.code === "Space" && profileIsValid && stateRef.current !== "waiting" && stateRef.current !== "target") {
        event.preventDefault();
        startRound();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pauseGame, profileIsValid, resumeGame, showMenu, startRound]);

  useEffect(() => () => {
    clearRevealTimeout();
    clearAutoReset();
    stopAnimation();
  }, [clearAutoReset, clearRevealTimeout, stopAnimation]);

  const statusText: Record<GameState, string> = {
    idle: "Listo para empezar",
    waiting: "Prepárate",
    target: "¡DISPARA!",
    tooSoon: "Disparo prematuro",
    result: "Ronda completada",
  };

  return (
    <div className="reaction-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">+</div>
          <div>
            <p className="eyebrow">AIM TRAINING</p>
            <h1>Reaction Shooter</h1>
          </div>
        </div>
        <div className={`status-badge status-${state}`} aria-live="polite">
          <span className="status-dot" />
          {statusText[state]}
        </div>
        <ProfileEditor name={profileName} error={profileError} onChange={onProfileNameChange} />
      </header>

      <main className="dashboard">
        <section className="game-card">
          <div className="game-toolbar">
            <div>
              <span className="section-label">MODO DE PRUEBA</span>
              <p className="mode-description">{difficultyConfig[difficulty].description}</p>
            </div>

            <div className="difficulty-switch" role="group" aria-label="Seleccionar dificultad">
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
          </div>

          <div
            ref={playRef}
            className={`play-area state-${state}`}
            onClick={handlePlayAreaClick}
            role="application"
            aria-label="Área de prueba de reacción"
          >
            <div className="arena-grid" aria-hidden="true" />

            {state === "idle" && (
              <div className="arena-message">
                <span className="crosshair-large" aria-hidden="true">+</span>
                <strong>¿Listo?</strong>
                <span>Haz clic en iniciar y espera la señal.</span>
              </div>
            )}

            {state === "waiting" && (
              <div className="arena-message waiting-message">
                <span className="waiting-line" />
                <strong>ESPERA</strong>
                <span>No dispares todavía</span>
              </div>
            )}

            {state === "tooSoon" && (
              <div className="arena-message error-message">
                <strong>FALLO</strong>
                <span>Disparo prematuro · nueva ronda en breve</span>
              </div>
            )}

            {state === "result" && lastTime !== null && (
              <div className="arena-message result-message">
                <span>TIEMPO DE REACCIÓN</span>
                <strong>{lastTime}<small> ms</small></strong>
                <span>Haz clic en <b>Otra ronda</b> para continuar.</span>
              </div>
            )}

            {targets.map((target) => (
              <div
                key={target.id}
                className={`target target-${difficulty} ${target.visible ? "is-visible" : "is-hidden"}`}
                style={{ left: target.x, top: target.y }}
                aria-hidden="true"
              >
                <div className="target-ring ring-outer" />
                <div className="target-ring ring-middle" />
                <div className="target-center" />
              </div>
            ))}

            <div className="arena-crosshair" aria-hidden="true">
              <span />
            </div>
          </div>

          <div className="game-actions">
            <button className="primary-action" onClick={startRound} type="button" disabled={!profileIsValid || state === "waiting" || state === "target"}>
              {state === "result" || state === "tooSoon" ? "Otra ronda" : "Iniciar prueba"}
              <kbd>SPACE</kbd>
            </button>
            <button className="secondary-action" onClick={pauseGame} type="button" disabled={state !== "waiting" && state !== "target"}>
              Pausar
              <kbd>ESC</kbd>
            </button>
            <button className="text-action" onClick={reset} type="button">
              Reiniciar estadísticas
            </button>
          </div>
        </section>

        <aside className="stats-panel">
          <div className="panel-heading">
            <span className="section-label">ESTADÍSTICAS</span>
            <span className="round-count">{attempts} {attempts === 1 ? "intento" : "intentos"}</span>
          </div>
          <div className="stat-list">
            <div className="stat-item highlight">
              <span>Mejor tiempo</span>
              <strong>{bestTime !== null ? `${bestTime} ms` : "—"}</strong>
            </div>
            <div className="stat-item">
              <span>Último tiempo</span>
              <strong>{lastTime !== null ? `${lastTime} ms` : "—"}</strong>
            </div>
            <div className="stat-item">
              <span>Dificultad</span>
              <strong>{difficultyConfig[difficulty].label}</strong>
            </div>
          </div>
          <div className="tips">
            <span className="section-label">CONTROLES</span>
            <p><b>Click</b> · Disparar al objetivo</p>
            <p><b>Space</b> · Iniciar una ronda</p>
            <p><b>Esc</b> · Pausar la prueba</p>
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        <span>Entrenamiento de reacción</span>
      </footer>

      {showMenu && (
        <div className="menu-overlay" role="dialog" aria-modal="true" aria-label="Juego pausado">
          <div className="menu-box">
            <span className="section-label">PRUEBA PAUSADA</span>
            <h2>¿Continuamos?</h2>
            <p>Tu progreso de la ronda actual se conserva.</p>
            <div className="menu-buttons">
              <button className="primary-action" onClick={resumeGame} type="button">Reanudar</button>
              <button className="secondary-action" onClick={reset} type="button">Salir de la ronda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
