import { useCallback, useEffect, useState } from "react";
import { getScores, type ScoreEntry } from "../services/scoreService";

export type LoadStatus = "loading" | "ready" | "error";

export const useLeaderboardController = (refreshSignal?: number) => {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadScores = useCallback(async () => {
    setStatus("loading");
    try {
      setScores(await getScores(100));
      setStatus("ready");
      setUpdatedAt(new Date());
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadScores();
  }, [loadScores, refreshSignal]);

  return { scores, status, updatedAt, loadScores };
};
