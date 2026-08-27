import { describe, expect, it } from "vitest";

import { formatByteSize, formatDuration, getAdaptiveReadingFontSize } from "../lib/reading-text";
import { makeRecordingFilename, rmsToDbfs, VadHysteresis } from "../lib/vad";

describe("rmsToDbfs", () => {
  it("đặt khoảng im lặng tuyệt đối ở sàn dBFS an toàn", () => {
    expect(rmsToDbfs([0, 0, 0])).toBe(-96);
  });

  it("xấp xỉ 0 dBFS cho sóng PCM toàn biên độ", () => {
    expect(rmsToDbfs([32767, -32768, 32767, -32768])).toBeCloseTo(0, 1);
  });
});

describe("VadHysteresis", () => {
  it("chỉ kết thúc đoạn sau khi im lặng vượt thời gian giữ", () => {
    const vad = new VadHysteresis(-45, 3, 1);
    expect(vad.process(-35)).toMatchObject({ isSpeech: true, shouldStartSegment: true, writeFrames: 1 });
    expect(vad.process(-50)).toMatchObject({ shouldEndSegment: false, writeFrames: 1 });
    expect(vad.process(-50)).toMatchObject({ shouldEndSegment: false, writeFrames: 1 });
    expect(vad.process(-50)).toMatchObject({ shouldEndSegment: false, writeFrames: 1 });
    expect(vad.process(-50)).toMatchObject({ shouldEndSegment: true, writeFrames: 1, discardedFrames: 3 });
  });

  it("khởi động lại đoạn ngay khi giọng nói trở lại", () => {
    const vad = new VadHysteresis(-45, 1, 1);
    vad.process(-30);
    vad.process(-60);
    vad.process(-60);
    expect(vad.process(-40)).toMatchObject({ isSpeech: true, shouldStartSegment: true });
  });
});

describe("tiện ích giao diện và tên tệp", () => {
  it("rút cỡ chữ khi nội dung đọc dài hơn", () => {
    expect(getAdaptiveReadingFontSize("ngắn")).toBeGreaterThan(getAdaptiveReadingFontSize("a".repeat(800)));
  });

  it("hiển thị thời lượng và dung lượng có thể đọc", () => {
    expect(formatDuration(65_900)).toBe("01:05");
    expect(formatByteSize(1_572_864)).toBe("1.5 MB");
  });

  it("tạo tên tệp WAV ổn định", () => {
    expect(makeRecordingFilename(Date.UTC(2026, 7, 27, 12, 30, 10))).toMatch(/^A56_GhiAm_2026-08-27T12-30-10-000Z\.wav$/);
  });
});
