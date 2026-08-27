import { memo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { getAdaptiveReadingFontSize } from "@/lib/reading-text";
import type { ScriptPanel } from "@/lib/recorder-types";

type ScriptPanelProps = {
  panel: ScriptPanel;
  onChangeText: (id: ScriptPanel["id"], text: string) => void;
  onToggleLock: (id: ScriptPanel["id"]) => void;
};

export const ScriptPanelCard = memo(function ScriptPanelCard({
  panel,
  onChangeText,
  onToggleLock,
}: ScriptPanelProps) {
  const hasText = panel.text.trim().length > 0;
  const fontSize = getAdaptiveReadingFontSize(panel.text);

  return (
    <View style={[styles.card, panel.locked && styles.cardLocked]}>
      <View style={styles.topLine}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{panel.id}</Text>
        </View>
        <Text style={styles.panelHint} numberOfLines={1}>
          {hasText ? "Sẵn sàng đọc" : "Dán nội dung để đọc"}
        </Text>
        <Pressable
          accessibilityLabel={panel.locked ? `Mở khóa phần ${panel.id}` : `Khóa phần ${panel.id}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onToggleLock(panel.id)}
          style={({ pressed }) => [styles.lockButton, pressed && styles.pressed]}
        >
          <Text style={styles.lockText}>{panel.locked ? "KHÓA" : "SỬA"}</Text>
        </Pressable>
      </View>
      <TextInput
        accessibilityLabel={`Nội dung đọc phần ${panel.id}`}
        editable={!panel.locked}
        multiline
        onChangeText={(text) => onChangeText(panel.id, text)}
        placeholder={`Chạm để dán phần ${panel.id}`}
        placeholderTextColor="#5E716F"
        scrollEnabled
        selectionColor="#35D7B6"
        style={[styles.input, { fontSize, lineHeight: Math.round(fontSize * 1.42) }, panel.locked && styles.inputLocked]}
        textAlignVertical="top"
        value={panel.text}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111619",
    borderColor: "#273238",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    paddingBottom: 5,
    paddingHorizontal: 13,
    paddingTop: 9,
  },
  cardLocked: {
    backgroundColor: "#0D1415",
    borderColor: "#1E5B52",
  },
  input: {
    color: "#F1F7F6",
    flex: 1,
    fontWeight: "500",
    letterSpacing: 0.05,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 4,
  },
  inputLocked: {
    color: "#D5E6E2",
  },
  lockButton: {
    alignItems: "center",
    borderColor: "#3A4B4A",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 43,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  lockText: {
    color: "#9BAAA9",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  numberBadge: {
    alignItems: "center",
    backgroundColor: "#16463F",
    borderRadius: 7,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  numberText: {
    color: "#7FF0D6",
    fontSize: 12,
    fontWeight: "800",
  },
  panelHint: {
    color: "#839492",
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.97 }],
  },
  topLine: {
    alignItems: "center",
    flexDirection: "row",
  },
});

