import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { formatByteSize, formatDuration } from "@/lib/reading-text";
import type { StoredRecording } from "@/lib/recorder-types";

type RecordingLibrarySheetProps = {
  visible: boolean;
  recordings: StoredRecording[];
  onClose: () => void;
  onExport: (recording: StoredRecording) => void;
  onDelete: (recording: StoredRecording) => void;
};

export function RecordingLibrarySheet({ visible, recordings, onClose, onExport, onDelete }: RecordingLibrarySheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.title}>Bản ghi trên máy</Text>
              <Text style={styles.subtitle}>{recordings.length} tệp · chỉ lưu cục bộ</Text>
            </View>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.pressed]}><Text style={styles.closeText}>ĐÓNG</Text></Pressable>
          </View>
          {recordings.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyTitle}>Chưa có bản ghi</Text><Text style={styles.emptyCopy}>Hoàn tất một phiên ghi âm để tệp WAV đã cắt khoảng lặng xuất hiện tại đây.</Text></View>
          ) : (
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {recordings.map((recording) => (
                <View key={recording.id} style={styles.recordingCard}>
                  <View style={styles.recordingInfo}>
                    <Text numberOfLines={1} style={styles.filename}>{recording.filename}</Text>
                    <Text style={styles.metadata}>{formatDuration(recording.durationMs)} · {formatByteSize(recording.sizeBytes)} · {recording.format.toUpperCase()}</Text>
                    {recording.removedSilenceMs ? <Text style={styles.saved}>Đã lược {formatDuration(recording.removedSilenceMs)} khoảng lặng</Text> : null}
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable onPress={() => onExport(recording)} style={({ pressed }) => [styles.export, pressed && styles.pressed]}><Text style={styles.exportText}>LƯU</Text></Pressable>
                    <Pressable onPress={() => onDelete(recording)} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}><Text style={styles.deleteText}>XÓA</Text></Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.64)", flex: 1, justifyContent: "flex-end" },
  close: { padding: 8 }, closeText: { color: "#70EBD0", fontSize: 12, fontWeight: "900", letterSpacing: 0.6 },
  delete: { padding: 7 }, deleteText: { color: "#FB848A", fontSize: 10, fontWeight: "900" },
  empty: { alignItems: "center", borderColor: "#273238", borderRadius: 16, borderStyle: "dashed", borderWidth: 1, marginTop: 18, padding: 28 },
  emptyCopy: { color: "#839492", fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: "center" }, emptyTitle: { color: "#E5F2EF", fontSize: 16, fontWeight: "800" },
  export: { backgroundColor: "#1C6155", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 }, exportText: { color: "#DDFBF4", fontSize: 10, fontWeight: "900" },
  filename: { color: "#E9F4F1", fontSize: 13, fontWeight: "800" },
  list: { gap: 10, paddingTop: 16 }, metadata: { color: "#839492", fontSize: 11, marginTop: 4 },
  pressed: { opacity: 0.66, transform: [{ scale: 0.97 }] },
  recordingCard: { alignItems: "center", backgroundColor: "#172023", borderColor: "#273238", borderRadius: 13, borderWidth: 1, flexDirection: "row", padding: 12 },
  recordingInfo: { flex: 1, paddingRight: 6 }, rowActions: { alignItems: "center", flexDirection: "row" },
  saved: { color: "#75E2CB", fontSize: 10, fontWeight: "700", marginTop: 4 },
  sheet: { backgroundColor: "#111619", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "72%", minHeight: 330, padding: 20, paddingBottom: 30 },
  sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  subtitle: { color: "#839492", fontSize: 12, marginTop: 3 }, title: { color: "#F1F7F6", fontSize: 20, fontWeight: "900" },
});

