export type VadDecision = {
  isSpeech: boolean;
  shouldStartSegment: boolean;
  shouldEndSegment: boolean;
  writeFrames: number;
  discardedFrames: number;
};

export function rmsToDbfs(samples: readonly number[]): number {
  if (samples.length === 0) return -96;
  const sumSquares = samples.reduce((sum, sample) => {
    const normalized = sample / 32768;
    return sum + normalized * normalized;
  }, 0);
  const rms = Math.sqrt(sumSquares / samples.length);
  return 20 * Math.log10(Math.max(rms, Math.pow(10, -96 / 20)));
}

/**
 * A pure reference implementation of the hold-time decision used by the Android
 * recorder. Audio samples are written by the native recorder, while this class
 * makes threshold behavior easy to test deterministically.
 */
export class VadHysteresis {
  private inSpeech = false;
  private silentFrames = 0;

  constructor(
    private readonly thresholdDb: number,
    private readonly holdFrames: number,
    private readonly postRollFrames: number,
  ) {}

  process(levelDb: number): VadDecision {
    const isSpeech = levelDb >= this.thresholdDb;
    if (isSpeech) {
      const shouldStartSegment = !this.inSpeech;
      this.inSpeech = true;
      this.silentFrames = 0;
      return { isSpeech: true, shouldStartSegment, shouldEndSegment: false, writeFrames: 1, discardedFrames: 0 };
    }

    if (!this.inSpeech) {
      return { isSpeech: false, shouldStartSegment: false, shouldEndSegment: false, writeFrames: 0, discardedFrames: 1 };
    }

    this.silentFrames += 1;
    if (this.silentFrames <= this.holdFrames) {
      return { isSpeech: false, shouldStartSegment: false, shouldEndSegment: false, writeFrames: 1, discardedFrames: 0 };
    }

    this.inSpeech = false;
    const framesToKeep = Math.min(this.silentFrames, this.postRollFrames);
    return { isSpeech: false, shouldStartSegment: false, shouldEndSegment: true, writeFrames: framesToKeep, discardedFrames: this.silentFrames - framesToKeep };
  }
}

export function makeRecordingFilename(epochMs: number): string {
  const iso = new Date(epochMs).toISOString().replace(/[.:]/g, "-");
  return `A56_GhiAm_${iso}.wav`;
}
