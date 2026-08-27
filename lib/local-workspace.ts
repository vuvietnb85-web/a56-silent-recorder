import AsyncStorage from "@react-native-async-storage/async-storage";

import { createDefaultWorkspace, type Workspace } from "./recorder-types";

const WORKSPACE_KEY = "a56-silent-recorder/workspace-v1";

function sanitizeWorkspace(candidate: Partial<Workspace> | null): Workspace {
  const fallback = createDefaultWorkspace();
  if (!candidate) return fallback;

  return {
    panels:
      Array.isArray(candidate.panels) && candidate.panels.length === 4
        ? fallback.panels.map((panel, index) => ({
            ...panel,
            ...candidate.panels?.[index],
            id: panel.id,
            text: String(candidate.panels?.[index]?.text ?? ""),
            locked: Boolean(candidate.panels?.[index]?.locked),
          }))
        : fallback.panels,
    settings: { ...fallback.settings, ...(candidate.settings ?? {}) },
    recordings: Array.isArray(candidate.recordings) ? candidate.recordings : [],
  };
}

export async function loadWorkspace(): Promise<Workspace> {
  try {
    const raw = await AsyncStorage.getItem(WORKSPACE_KEY);
    return raw ? sanitizeWorkspace(JSON.parse(raw)) : createDefaultWorkspace();
  } catch {
    return createDefaultWorkspace();
  }
}

export async function saveWorkspace(workspace: Workspace): Promise<void> {
  await AsyncStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
}

