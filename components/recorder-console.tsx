import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatDuration } from "@/lib/reading-text";
import type { RecorderPhase, VadSettings } from "@/lib/recorder-types";

type RecorderConsoleProps = {
  phase: RecorderPhase;
  durationMs: number;
  meterDb: number;
  settings: VadSettings;
  onPrimary: () => void;
  onPause: () => void;
  onFinish: () => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
};

const phaseCopy: Record<RecorderPhase, string> = {
  idle: "Sẵn sàng ghi âm ngoại tuyến",
  recording: "Đang ghi — VAD đang lọc khoảng lặng",
  paused: "Đã tạm dừng — tệp vẫn ở trên máy",
  processing: "Đang hoàn tất tệp âm thanh…",
};

export function RecorderConsole({
  phase,
  durationMs,
  meterDb,
  settings,
  onPrimary,
  onPause,
  onFinish,
  onOpenLibrary,
  onOpenSettings,
}: RecorderConsoleProps) {
  const isActive = phase === "recording";
  const isPaused = phase === "paused";
  const isBusy = phase === "processing";
  const meterPercent = Math.max(5, Math.min(100, ((meterDb + 60) / 54) * 100));
  const vadListening = isActive && meterDb >= settings.thresholdDb;

  return (
    <View style={[styles.console, isActive && styles.consoleActive]}>
      <View style={styles.consoleTop}>
        <View>
          <Text style={styles.brand}>A56 GHI ÂM</Text>
          <Text style={styles.status}>{phaseCopy[phase]}</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable onPress={onOpenLibrary} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
            <Text style={styles.textActionLabel}>TỆP</Text>
          </Pressable>
          <Pressable onPress={onOpenSettings} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
            <Text style={styles.textActionLabel}>TÙY CHỈNH</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.signalRow}>
        <View style={styles.timeBlock}>
          <Text style={[styles.clock, isActive && styles.clockActive]}>{formatDuration(durationMs)}</Text>
          <Text style={styles.quality}>PCM WAV · 48 kHz · MONO</Text>
        </View>
        <View style={styles.meterGroup}>
          <View style={styles.meterLabels}>
            <Text style={[styles.vad, vadListening && styles.vadActive]}>{isActive ? (vadListening ? "GIỌNG NÓI" : "KHOẢNG LẶNG") : "VAD SẴN SÀNG"}</Text>
            <Text style={styles.db}>{Math.round(meterDb)} dB</Text>
          </View>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${meterPercent}%` }, vadListening && styles.meterFillActive]} />
          </View>
          <Text style={styles.threshold}>Ngưỡng {settings.thresholdDb} dB · giữ {settings.holdMs} ms</Text>
        </View>
      </View>

      <View style={styles.controls}>
        {isActive || isPaused ? (
          <Pressable accessibilityLabel={isPaused ? "Tiếp tục ghi âm" : "Tạm dừng ghi âm"} onPress={onPause} style={({ pressed }) => [styles.secondaryControl, pressed && styles.pressed]}>
            <Text style={styles.secondarySymbol}>{isPaused ? "▶" : "Ⅱ"}</Text>
            <Text style={styles.secondaryLabel}>{isPaused ? "TIẾP TỤC" : "TẠM DỪNG"}</Text>
          </Pressable>
        ) : (
          <View style={styles.controlSpacer} />
        )}
        <Pressable
          accessibilityLabel={isActive || isPaused ? "Hoàn tất ghi âm" : "Bắt đầu ghi âm"}
          disabled={isBusy}
          onPress={isActive || isPaused ? onFinish : onPrimary}
          style={({ pressed }) => [styles.primaryControl, (isActive || isPaused) && styles.primaryStop, (pressed || isBusy) && styles.pressed]}
        >
          <View style={(isActive || isPaused) ? styles.stopMark : styles.recordMark} />
          <Text style={styles.primaryLabel}>{isBusy ? "ĐỢI" : isActive || isPaused ? "HOÀN TẤT" : "GHI ÂM"}</Text>
        </Pressable>
        <View style={styles.controlSpacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { color: "#D9F8F0", fontSize: 12, fontWeight: "900", letterSpacing: 1.1 },
  clock: { color: "#F1F7F6", fontSize: 28, fontVariant: ["tabular-nums"], fontWeight: "800", letterSpacing: 0.5 },
  clockActive: { color: "#FF7A81" },
  console: { backgroundColor: "#0E1618", borderColor: "#273238", borderRadius: 18, borderWidth: 1, minHeight: 202, padding: 14 },
  consoleActive: { borderColor: "#7C343B" },
  consoleTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  controlSpacer: { width: 72 },
  controls: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  db: { color: "#A6B7B5", fontSize: 10, fontWeight: "700" },
  meterFill: { backgroundColor: "#35D7B6", borderRadius: 99, height: "100%" },
  meterFillActive: { backgroundColor: "#80E8D1" },
  meterGroup: { flex: 1, marginLeft: 16 },
  meterLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  meterTrack: { backgroundColor: "#263536", borderRadius: 99, height: 7, overflow: "hidden" },
  primaryControl: { alignItems: "center", backgroundColor: "#FF5E67", borderRadius: 99, height: 70, justifyContent: "center", width: 104 },
  primaryLabel: { color: "#22090B", fontSize: 11, fontWeight: "900", letterSpacing: 0.8, marginTop: 3 },
  primaryStop: { backgroundColor: "#F1F7F6" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  quality: { color: "#839492", fontSize: 9, fontWeight: "800", letterSpacing: 0.6, marginTop: 1 },
  recordMark: { backgroundColor: "#290A0E", borderRadius: 99, height: 18, width: 18 },
  secondaryControl: { alignItems: "center", justifyContent: "center", width: 72 },
  secondaryLabel: { color: "#A8BBB8", fontSize: 9, fontWeight: "800", letterSpacing: 0.4, marginTop: 4, textAlign: "center" },
  secondarySymbol: { color: "#DDEAE7", fontSize: 22, fontWeight: "800", height: 24 },
  signalRow: { alignItems: "center", flexDirection: "row", marginTop: 10 },
  status: { color: "#829391", fontSize: 10, fontWeight: "600", marginTop: 3 },
  stopMark: { backgroundColor: "#FF5E67", borderRadius: 4, height: 16, width: 16 },
  textAction: { paddingHorizontal: 7, paddingVertical: 4 },
  textActionLabel: { color: "#7EE9D0", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  threshold: { color: "#637573", fontSize: 9, fontWeight: "600", marginTop: 5 },
  timeBlock: { minWidth: 104 },
  topActions: { flexDirection: "row", marginRight: -5 },
  vad: { color: "#7F9390", fontSize: 9, fontWeight: "900", letterSpacing: 0.45 },
  vadActive: { color: "#8AF2D8" },
});

