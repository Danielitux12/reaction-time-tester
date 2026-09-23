export type Difficulty = 1 | 2 | 3;

export const difficultyConfig: Record<Difficulty, { label: string; description: string }> = {
  1: { label: "Fácil", description: "Objetivo estático" },
  2: { label: "Medio", description: "Objetivos en movimiento" },
  3: { label: "Difícil", description: "Movimiento + desaparición" },
};

export const DIFFICULTY_LEVELS: Difficulty[] = [1, 2, 3];
