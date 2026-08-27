import { NativeEventEmitter, NativeModules, Platform, type EmitterSubscription } from "react-native";

import type { VadSettings } from "./recorder-types";

export type NativeRecordingResult = {
  uri: string;
  filename: string;
  durationMs: number;
  keptDurationMs: number;
  removedSilenceMs: number;
  sizeBytes: number;
  format: "wav";
};

export type NativeRecorderProgress = {
  durationMs: number;
  keptDurationMs: number;
  meterDb: number;
  isSpeech: boolean;
  removedSilenceMs: number;
};

type SilenceRecorderNativeModule = {
  start(settings: VadSettings): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  finish(): Promise<NativeRecordingResult>;
  cancel(): Promise<void>;
  delete(uri: string): Promise<void>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
};

const nativeModule = NativeModules.SilenceRecorder as SilenceRecorderNativeModule | undefined;
const nativeEmitter = nativeModule && Platform.OS === "android" ? new NativeEventEmitter(nativeModule) : null;

export const isNativeSilenceRecorderAvailable = Boolean(nativeModule && Platform.OS === "android");

function getNativeModule(): SilenceRecorderNativeModule {
  if (!nativeModule) throw new Error("Bộ ghi PCM chỉ sẵn sàng trong APK Android đã tạo.");
  return nativeModule;
}

export function startNativeSilenceRecorder(settings: VadSettings): Promise<void> {
  return getNativeModule().start(settings);
}

export function pauseNativeSilenceRecorder(): Promise<void> {
  return getNativeModule().pause();
}

export function resumeNativeSilenceRecorder(): Promise<void> {
  return getNativeModule().resume();
}

export function finishNativeSilenceRecorder(): Promise<NativeRecordingResult> {
  return getNativeModule().finish();
}

export function cancelNativeSilenceRecorder(): Promise<void> {
  return getNativeModule().cancel();
}

export function deleteNativeRecording(uri: string): Promise<void> {
  return getNativeModule().delete(uri);
}

export function subscribeNativeRecorderProgress(listener: (progress: NativeRecorderProgress) => void): EmitterSubscription | null {
  return nativeEmitter?.addListener("A56RecorderProgress", listener) ?? null;
}

