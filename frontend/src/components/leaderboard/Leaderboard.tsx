import "./Leaderboard.css";
import { useState } from "react";
import { useLeaderboardController } from "../../controllers/useLeaderboardController";
import { DIFFICULTY_LEVELS, difficultyConfig, type Difficulty } from "../../config/difficulty";

type DifficultyFilter = "all" | Difficulty;

const TOP_COUNT = 20;

type LeaderboardProps = {
  refreshSignal?: number;
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

export default function Leaderboard({ refreshSignal }: LeaderboardProps) {
  const [filter, setFilter] = useState<DifficultyFilter>("all");
  const { scores, status, updatedAt, loadScores } = useLeaderboardController(refreshSignal);

  const filtered = (filter === "all" ? scores : scores.filter((entry) => entry.difficulty === filter)).slice(
    0,
    TOP_COUNT,
  );

  return (
    <section className="leaderboard-panel">
      <div className="leaderboard-heading">
        <div>
          <span className="section-label">RANKING GLOBAL</span>
          <h2>Top 20 · Mejores tiempos</h2>
        </div>

        <div className="leaderboard-controls">
          <div className="difficulty-switch" role="group" aria-label="Filtrar ranking por dificultad">
            <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
              Todas
            </button>
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={filter === level ? "active" : ""}
                onClick={() => setFilter(level)}
              >
                {difficultyConfig[level].label}
              </button>
            ))}
          </div>

          <button className="text-action" type="button" onClick={() => void loadScores()} disabled={status === "loading"}>
            {status === "loading" ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {status === "error" && (
        <div className="leaderboard-message leaderboard-error">
          <span>No se pudo cargar el ranking. ¿Está el backend corriendo?</span>
          <button className="text-action" type="button" onClick={() => void loadScores()}>
            Reintentar
          </button>
        </div>
      )}

      {status === "loading" && scores.length === 0 && (
        <div className="leaderboard-message">Cargando ranking...</div>
      )}

      {status === "ready" && filtered.length === 0 && (
        <div className="leaderboard-message">
          Aún no hay tiempos registrados{filter !== "all" ? " en esta dificultad" : ""}. ¡Sé el primero!
        </div>
      )}

      {filtered.length > 0 && (
        <ol className="leaderboard-list">
          <li className="leaderboard-row leaderboard-row-head" aria-hidden="true">
            <span>#</span>
            <span>Jugador</span>
            <span>Dificultad</span>
            <span>Fecha</span>
            <span>Tiempo</span>
          </li>
          {filtered.map((entry, index) => (
            <li key={entry.id} className={`leaderboard-row${index < 3 ? ` top-${index + 1}` : ""}`}>
              <span className="rank-pos">{index + 1}</span>
              <span className="rank-player">{entry.player?.trim() || "guest"}</span>
              <span className="rank-difficulty">
                {difficultyConfig[entry.difficulty as Difficulty]?.label ?? "—"}
              </span>
              <span className="rank-date">{formatDate(entry.createdAt)}</span>
              <span className="rank-time">
                {entry.timeMs}
                <small> ms</small>
              </span>
            </li>
          ))}
        </ol>
      )}

      {updatedAt && <p className="leaderboard-updated">Actualizado {updatedAt.toLocaleTimeString("es-ES")}</p>}
    </section>
  );
}
