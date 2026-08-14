import { useEffect, useState } from 'react';
import { VolumeData } from '@/types/Volume';
import type { DecodeWorkerMessage } from '@/lib/dicom/decode-worker';

// Cache decoded volumes by URL, matching how drei's useGLTF/useTexture cache internally
const volumeCache = new Map<string, VolumeData>();
const inFlight = new Map<string, { promise: Promise<VolumeData>; onProgress: Set<(progress: number) => void> }>();

function decodeVolume(url: string, onProgress: (progress: number) => void): Promise<VolumeData> {
  const cached = volumeCache.get(url);
  if (cached) return Promise.resolve(cached);

  let entry = inFlight.get(url);
  if (!entry) {
    const onProgressCallbacks = new Set<(progress: number) => void>();

    const promise = new Promise<VolumeData>((resolve, reject) => {
      const worker = new Worker(new URL('../dicom/decode-worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (event: MessageEvent<DecodeWorkerMessage>) => {
        const message = event.data;

        if (message.type === 'progress') {
          onProgressCallbacks.forEach((fn) => fn(message.progress));
        } else if (message.type === 'done') {
          const { metadata, data, min, max } = message;
          const volume: VolumeData = {
            dimensions: [metadata.columns, metadata.rows, metadata.numFrames],
            // pixelSpacing is [row spacing, column spacing] -> [Y, X]; dimensions are [X, Y, Z]
            spacing: [metadata.pixelSpacing[1], metadata.pixelSpacing[0], metadata.spacingBetweenSlices],
            data: new Uint16Array(data),
            min,
            max,
          };
          volumeCache.set(url, volume);
          worker.terminate();
          resolve(volume);
        } else if (message.type === 'error') {
          worker.terminate();
          reject(new Error(message.message));
        }
      };

      worker.onerror = (event) => {
        worker.terminate();
        reject(new Error(event.message));
      };

      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch DICOM file: ${response.status} ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then((buffer) => worker.postMessage({ buffer }, [buffer]))
        .catch((err) => {
          worker.terminate();
          reject(err instanceof Error ? err : new Error(String(err)));
        });
    }).finally(() => {
      inFlight.delete(url);
    });

    entry = { promise, onProgress: onProgressCallbacks };
    inFlight.set(url, entry);
  }

  entry.onProgress.add(onProgress);
  return entry.promise;
}

export function useDicomVolume(url: string | undefined) {
  const [volume, setVolume] = useState<VolumeData | null>(() => (url && volumeCache.get(url)) || null);
  const [progress, setProgress] = useState(() => (url && volumeCache.has(url) ? 1 : 0));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;

    const cached = volumeCache.get(url);
    if (cached) {
      setVolume(cached);
      setProgress(1);
      setError(null);
      return;
    }

    let cancelled = false;
    setVolume(null);
    setProgress(0);
    setError(null);

    // Capped below 1: progress and "done" are separate postMessage calls, so this could hit 1 a
    // tick before volume is actually set — consumers treat progress === 1 as "ready".
    const onProgress = (p: number) => {
      if (!cancelled) setProgress(Math.min(p, 0.999));
    };

    decodeVolume(url, onProgress)
      .then((v) => {
        if (!cancelled) {
          setVolume(v);
          setProgress(1);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { volume, progress, error };
}
