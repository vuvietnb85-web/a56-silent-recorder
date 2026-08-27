import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { VadSettings } from "@/lib/recorder-types";

type AudioSettingsSheetProps = {
  visible: boolean;
  settings: VadSettings;
  onClose: () => void;
  onChange: (next: VadSettings) => void;
};

type Adjustment = { key: keyof VadSettings; label: string; unit: string; step: number; min: number; max: number; help: string };

const adjustments: Adjustment[] = [
  { key: "thresholdDb", label: "Ngưỡng im lặng", unit: "dB", step: 2, min: -60, max: -24, help: "Âm dưới ngưỡng này được xem là im lặng." },
  { key: "holdMs", label: "Giữ ngưỡng", unit: "ms", step: 50, min: 150, max: 900, help: "Chỉ cắt khi im lặng kéo dài quá thời gian này." },
  { key: "preRollMs", label: "Đệm đầu câu", unit: "ms", step: 20, min: 0, max: 300, help: "Giữ lại đầu phụ âm trước khi có tiếng nói." },
  { key: "postRollMs", label: "Đệm cuối câu", unit: "ms", step: 20, min: 0, max: 300, help: "Giữ lại phần âm cuối trước khi cắt." },
];

export function AudioSettingsSheet({ visible, settings, onClose, onChange }: AudioSettingsSheetProps) {
  const adjust = (setting: Adjustment, direction: -1 | 1) => {
    const nextValue = Math.max(setting.min, Math.min(setting.max, settings[setting.key] + setting.step * direction));
    onChange({ ...settings, [setting.key]: nextValue });
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.title}>Cắt khoảng lặng</Text>
              <Text style={styles.subtitle}>Thiết lập dùng cho lần ghi kế tiếp</Text>
            </View>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Text style={styles.closeText}>XONG</Text>
            </Pressable>
          </View>
          {adjustments.map((setting) => (
            <View key={setting.key} style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={styles.settingLabel}>{setting.label}</Text>
                <Text style={styles.settingHelp}>{setting.help}</Text>
              </View>
              <View style={styles.stepper}>
                <Pressable onPress={() => adjust(setting, -1)} style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}><Text style={styles.stepperText}>−</Text></Pressable>
                <Text style={styles.value}>{settings[setting.key]} {setting.unit}</Text>
                <Pressable onPress={() => adjust(setting, 1)} style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}><Text style={styles.stepperText}>+</Text></Pressable>
              </View>
            </View>
          ))}
          <View style={styles.note}>
            <Text style={styles.noteText}>Mặc định: −45 dB, 300 ms, đệm 120 ms. Các thông số được lưu cục bộ, không gửi ra mạng.</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.64)", flex: 1, justifyContent: "flex-end" },
  close: { padding: 8 },
  closeText: { color: "#70EBD0", fontSize: 12, fontWeight: "900", letterSpacing: 0.6 },
  note: { backgroundColor: "#102120", borderColor: "#1F4A43", borderRadius: 12, borderWidth: 1, marginTop: 16, padding: 12 },
  noteText: { color: "#B9D5CF", fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.66, transform: [{ scale: 0.97 }] },
  settingCopy: { flex: 1, paddingRight: 12 },
  settingHelp: { color: "#80918F", fontSize: 11, lineHeight: 15, marginTop: 4 },
  settingLabel: { color: "#F1F7F6", fontSize: 14, fontWeight: "800" },
  settingRow: { alignItems: "center", borderBottomColor: "#273238", borderBottomWidth: 1, flexDirection: "row", paddingVertical: 13 },
  sheet: { backgroundColor: "#111619", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  stepper: { alignItems: "center", flexDirection: "row" },
  stepperButton: { alignItems: "center", backgroundColor: "#253536", borderRadius: 8, height: 32, justifyContent: "center", width: 32 },
  stepperText: { color: "#D8EEEA", fontSize: 21, fontWeight: "700", marginTop: -2 },
  subtitle: { color: "#839492", fontSize: 12, marginTop: 3 },
  title: { color: "#F1F7F6", fontSize: 20, fontWeight: "900" },
  value: { color: "#A1F0DE", fontSize: 12, fontVariant: ["tabular-nums"], fontWeight: "800", textAlign: "center", width: 78 },
});

