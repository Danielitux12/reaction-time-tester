import { API_URL } from "../config/api";
import { getToken } from "./authService";

export type ScoreEntry = {
  id: number;
  player: string | null;
  difficulty: number;
  timeMs: number;
  attempts: number;
  createdAt: string;
};

export type SaveScorePayload = {
  difficulty: number;
  timeMs: number;
  attempts: number;
  player?: string;
};

const scoresUrl = (limit?: number, difficulty?: number) => {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit.toString());
  if (difficulty) params.set("difficulty", difficulty.toString());
  const qs = params.toString();
  return `${API_URL}/api/scores${qs ? `?${qs}` : ""}`;
};

export const getScores = async (limit: number = 100, difficulty?: number): Promise<ScoreEntry[]> => {
  const response = await fetch(scoresUrl(limit, difficulty));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<ScoreEntry[]>;
};

export const saveScore = async (payload: SaveScorePayload): Promise<boolean> => {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(scoresUrl(), {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return response.ok;
};
