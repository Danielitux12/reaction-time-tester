export type GameState = "idle" | "waiting" | "target" | "tooSoon" | "result";

export type ShooterSettings = {
  sensitivity: number;
  invertY: boolean;
  crosshairStyle: "cross" | "dot" | "circle";
  crosshairColor: string;
  soundEnabled: boolean;
  volume: number;
};

export const DEFAULT_SETTINGS: ShooterSettings = {
  sensitivity: 1.0,
  invertY: false,
  crosshairStyle: "cross",
  crosshairColor: "#00ff66",
  soundEnabled: true,
  volume: 0.6,
};
