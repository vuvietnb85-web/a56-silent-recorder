import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { requestRecordingPermissionsAsync } from "expo-audio";
import * as NavigationBar from "expo-navigation-bar";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";

import { AudioSettingsSheet } from "@/components/audio-settings-sheet";
import { RecorderConsole } from "@/components/recorder-console";
import { RecordingLibrarySheet } from "@/components/recording-library-sheet";
import { ScriptPanelCard } from "@/components/script-panel";
import { loadWorkspace, saveWorkspace } from "@/lib/local-workspace";
import { cancelNativeSilenceRecorder, deleteNativeRecording, finishNativeSilenceRecorder, isNativeSilenceRecorderAvailable, pauseNativeSilenceRecorder, resumeNativeSilenceRecorder, startNativeSilenceRecorder, subscribeNativeRecorderProgress } from "@/lib/native-silence-recorder";
import { createDefaultWorkspace, type RecorderPhase, type ScriptPanel, type StoredRecording, type VadSettings, type Workspace } from "@/lib/recorder-types";

const KEEP_AWAKE_TAG = "a56-recorder-reading";

export default function HomeScreen() {
  const [workspace, setWorkspace] = useState<Workspace>(createDefaultWorkspace());
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [durationMs, setDurationMs] = useState(0);
  const [meterDb, setMeterDb] = useState(-60);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);
  const durationStartedAt = useRef<number | null>(null);
  const elapsedBeforeStart = useRef(0);
  const keepAwakeActive = useRef(false);

  useEffect(() => {
    loadWorkspace().then((saved) => {
      setWorkspace(saved);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = setTimeout(() => void saveWorkspace(workspace), 350);
    return () => clearTimeout(timeout);
  }, [hydrated, workspace]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void NavigationBar.setVisibilityAsync("hidden");
    void NavigationBar.setBehaviorAsync("overlay-swipe");
    return () => { void NavigationBar.setVisibilityAsync("visible"); };
  }, []);

  useEffect(() => {
    if (phase !== "recording") return;
    keepAwakeActive.current = true;
    void activateKeepAwake(KEEP_AWAKE_TAG);
  }, [phase]);

  useEffect(() => {
    if (phase === "recording" || !keepAwakeActive.current) return;
    keepAwakeActive.current = false;
    void deactivateKeepAwake(KEEP_AWAKE_TAG);
  }, [phase]);

  useEffect(() => {
    const subscription = subscribeNativeRecorderProgress((progress) => {
      setDurationMs(progress.durationMs);
      setMeterDb(progress.meterDb);
    });
    return () => subscription?.remove();
  }, []);

  const panels = useMemo(() => workspace.panels, [workspace.panels]);

  const updatePanel = (id: ScriptPanel["id"], text: string) => {
    setWorkspace((current) => ({
      ...current,
      panels: current.panels.map((panel) => panel.id === id ? { ...panel, text, updatedAt: Date.now() } : panel),
    }));
  };

  const togglePanelLock = (id: ScriptPanel["id"]) => {
    setWorkspace((current) => ({
      ...current,
      panels: current.panels.map((panel) => panel.id === id ? { ...panel, locked: !panel.locked } : panel),
    }));
  };

  const updateSettings = (settings: VadSettings) => setWorkspace((current) => ({ ...current, settings }));

  const startRecording = async () => {
    if (!isNativeSilenceRecorderAvailable) {
      Alert.alert("Cần APK Android", "Bộ ghi PCM 48 kHz và cắt khoảng lặng chạy native. Hãy mở bản APK đã xuất thay vì bản xem trước trên web.");
      return;
    }
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Chưa có quyền microphone", "Hãy cho phép ứng dụng sử dụng micrô để ghi âm ngoại tuyến.");
        return;
      }
      setDurationMs(0);
      setMeterDb(-60);
      await startNativeSilenceRecorder(workspace.settings);
      setPhase("recording");
    } catch (error) {
      Alert.alert("Không thể bắt đầu ghi", error instanceof Error ? error.message : "Đã xảy ra lỗi microphone.");
      setPhase("idle");
    }
  };

  const pauseRecording = async () => {
    try {
      if (phase === "recording") {
        await pauseNativeSilenceRecorder();
        setPhase("paused");
      } else if (phase === "paused") {
        await resumeNativeSilenceRecorder();
        setPhase("recording");
      }
    } catch (error) {
      Alert.alert("Không thể đổi trạng thái", error instanceof Error ? error.message : "Đã xảy ra lỗi microphone.");
    }
  };

  const finishRecording = async () => {
    setPhase("processing");
    try {
      const result = await finishNativeSilenceRecorder();
      const recording: StoredRecording = {
        id: `${Date.now()}-${result.filename}`,
        uri: result.uri,
        filename: result.filename,
        durationMs: result.keptDurationMs,
        createdAt: Date.now(),
        format: "wav",
        sizeBytes: result.sizeBytes,
        removedSilenceMs: result.removedSilenceMs,
      };
      setWorkspace((current) => ({ ...current, recordings: [recording, ...current.recordings] }));
      Alert.alert("Đã hoàn tất", `Đã tạo ${recording.filename} trên máy. Đã lược ${Math.round(result.removedSilenceMs / 1000)} giây khoảng lặng.`);
    } catch (error) {
      Alert.alert("Không thể hoàn tất tệp", error instanceof Error ? error.message : "Đã xảy ra lỗi khi ghi WAV.");
      void cancelNativeSilenceRecorder();
    } finally {
      setPhase("idle");
      setMeterDb(-60);
    }
  };

  const exportRecording = async (recording: StoredRecording) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Không hỗ trợ lưu tệp", "Thiết bị này không có ứng dụng hỗ trợ lưu hoặc chia sẻ tệp WAV.");
        return;
      }
      await Sharing.shareAsync(recording.uri, { dialogTitle: "Lưu bản ghi vào máy", mimeType: "audio/wav" });
    } catch (error) {
      Alert.alert("Không thể lưu tệp", error instanceof Error ? error.message : "Hãy thử lại hoặc kiểm tra dung lượng máy.");
    }
  };

  const deleteRecording = (recording: StoredRecording) => {
    Alert.alert("Xóa bản ghi?", `${recording.filename} sẽ bị xóa khỏi điện thoại.`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa", style: "destructive", onPress: () => {
          void deleteNativeRecording(recording.uri).catch(() => undefined);
          setWorkspace((current) => ({ ...current, recordings: current.recordings.filter((item) => item.id !== recording.id) }));
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar hidden style="light" />
      <View style={styles.panels}>
        {panels.map((panel) => <ScriptPanelCard key={panel.id} onChangeText={updatePanel} onToggleLock={togglePanelLock} panel={panel} />)}
      </View>
      <RecorderConsole
        durationMs={durationMs}
        meterDb={meterDb}
        onFinish={finishRecording}
        onOpenLibrary={() => setLibraryVisible(true)}
        onOpenSettings={() => setSettingsVisible(true)}
        onPause={pauseRecording}
        onPrimary={startRecording}
        phase={phase}
        settings={workspace.settings}
      />
      <AudioSettingsSheet onChange={updateSettings} onClose={() => setSettingsVisible(false)} settings={workspace.settings} visible={settingsVisible} />
      <RecordingLibrarySheet onClose={() => setLibraryVisible(false)} onDelete={deleteRecording} onExport={exportRecording} recordings={workspace.recordings} visible={libraryVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  panels: { flex: 1, gap: 7, minHeight: 0, paddingBottom: 8 },
  screen: { backgroundColor: "#080A0B", flex: 1, paddingBottom: 10, paddingHorizontal: 10, paddingTop: 10 },
});
