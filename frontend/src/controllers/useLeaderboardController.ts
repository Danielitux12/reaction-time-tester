import { useCallback, useEffect, useState } from "react";
import { getScores, type ScoreEntry } from "../services/scoreService";
import type { Difficulty } from "../config/difficulty";

export type LoadStatus = "loading" | "ready" | "error";

export const useLeaderboardController = (difficulty: Difficulty = 1, refreshSignal?: number) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadScores = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getScores(100, difficulty);
      setScores(data);
      setStatus("ready");
      setUpdatedAt(new Date());
    } catch {
      setStatus("error");
    }
  }, [difficulty]);

  useEffect(() => {
    let ignore = false;
    getScores(100, difficulty)
      .then((data) => {
        if (!ignore) {
          setScores(data);
          setStatus("ready");
          setUpdatedAt(new Date());
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus("error");
        }
      });

    return () => {
      ignore = true;
    };
  }, [difficulty, refreshSignal]);

  return { scores, status, updatedAt, loadScores };
};
