import { DataUtils } from 'three';
import { decodeFrame } from './decode-frames';
import { DicomVolumeMetadata, parseDicomVolume } from './parse-dicom';

export type DecodeWorkerRequest = {
  buffer: ArrayBuffer;
};

export type DecodeWorkerMessage =
  | { type: 'progress'; progress: number }
  | { type: 'done'; metadata: DicomVolumeMetadata; data: ArrayBuffer; min: number; max: number }
  | { type: 'error'; message: string };

// Narrow self-declared type instead of `/// <reference lib="webworker" />`, which conflicts with
// the project's DOM lib (both declare `self`) under the shared tsconfig.
type WorkerScope = {
  onmessage: ((event: { data: DecodeWorkerRequest }) => void) | null;
  postMessage: (message: DecodeWorkerMessage, transfer: Transferable[]) => void;
};

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (event) => {
  try {
    const byteArray = new Uint8Array(event.data.buffer);
    const parsed = parseDicomVolume(byteArray);
    const { rows, columns, samplesPerPixel, numFrames, rescaleSlope, rescaleIntercept } = parsed.metadata;
    const frameSize = rows * columns * samplesPerPixel;
    // Half-float bit patterns of rescaled real-world values, not raw sample values — every source
    // bit depth (8/16/32) is unified into this one representation so the texture/shader layer
    // never branches on it.
    const volume = new Uint16Array(frameSize * numFrames);

    let min = Infinity;
    let max = -Infinity;

    for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
      const frame = decodeFrame(parsed, frameIndex);
      const frameOffset = frameIndex * frameSize;

      for (let i = 0; i < frame.length; i++) {
        const value = frame[i] * rescaleSlope + rescaleIntercept;
        if (value < min) min = value;
        if (value > max) max = value;
        volume[frameOffset + i] = DataUtils.toHalfFloat(value);
      }

      if (frameIndex % 25 === 0 || frameIndex === numFrames - 1) {
        ctx.postMessage({ type: 'progress', progress: (frameIndex + 1) / numFrames }, []);
      }
    }

    ctx.postMessage({ type: 'done', metadata: parsed.metadata, data: volume.buffer, min, max }, [
      volume.buffer,
    ]);
  } catch (err) {
    ctx.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) }, []);
  }
};
