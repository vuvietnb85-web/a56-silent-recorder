export type ScriptPanel = {
  id: 1 | 2 | 3 | 4;
  text: string;
  locked: boolean;
  updatedAt: number;
};

export type VadSettings = {
  thresholdDb: number;
  holdMs: number;
  preRollMs: number;
  postRollMs: number;
};

export type StoredRecording = {
  id: string;
  uri: string;
  filename: string;
  durationMs: number;
  createdAt: number;
  format: "wav" | "m4a";
  sizeBytes?: number;
  removedSilenceMs?: number;
};

export type Workspace = {
  panels: ScriptPanel[];
  settings: VadSettings;
  recordings: StoredRecording[];
};

export type RecorderPhase = "idle" | "recording" | "paused" | "processing";

export const defaultSettings: VadSettings = {
  thresholdDb: -45,
  holdMs: 300,
  preRollMs: 120,
  postRollMs: 120,
};

export function createDefaultWorkspace(): Workspace {
  return {
    panels: [1, 2, 3, 4].map((id) => ({
      id: id as ScriptPanel["id"],
      text: "",
      locked: false,
      updatedAt: Date.now(),
    })),
    settings: defaultSettings,
    recordings: [],
  };
}

