export interface TimestampEntry {
  word: string;
  start: number;
  end: number;
}

export interface CaptionFrame {
  word: string;
  startFrame: number;
  endFrame: number;
}

export function convertTimestamps(
  timestamps: TimestampEntry[],
  fps = 30
): CaptionFrame[] {
  return timestamps.map((t) => ({
    word: t.word,
    startFrame: Math.round(t.start * fps),
    endFrame: Math.round(t.end * fps),
  }));
}
