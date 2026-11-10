export type Difficulty = 1 | 2 | 3;

export const difficultyConfig: Record<Difficulty, { label: string; description: string }> = {
  1: { label: "Easy", description: "Static target" },
  2: { label: "Medium", description: "Moving target" },
  3: { label: "Hard", description: "Moving + disappearing" },
};

export const DIFFICULTY_LEVELS: Difficulty[] = [1, 2, 3];
