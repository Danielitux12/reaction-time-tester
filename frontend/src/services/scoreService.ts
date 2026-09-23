import { API_URL } from "../config/api";

export type ScoreEntry = {
  id: number;
  player: string | null;
  difficulty: number;
  timeMs: number;
  attempts: number;
  createdAt: string;
};

export type SaveScorePayload = {
  player: string;
  difficulty: number;
  timeMs: number;
  attempts: number;
};

const scoresUrl = (limit?: number) => `${API_URL}/api/scores${limit ? `?limit=${limit}` : ""}`;

export const getScores = async (limit: number): Promise<ScoreEntry[]> => {
  const response = await fetch(scoresUrl(limit));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<ScoreEntry[]>;
};

export const saveScore = async (payload: SaveScorePayload) => {
  const response = await fetch(scoresUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.ok;
};
