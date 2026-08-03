import { useEffect, useMemo } from 'react';
import { ClampToEdgeWrapping, Data3DTexture, LinearFilter, RedFormat, UnsignedByteType } from 'three';
import useStore from '@/Store';
import { SrcObj } from '@/types/Src';
import { VOLUME_LOADING_PROGRESS } from '@/types/Events';
import { useEventTrigger } from '@/lib/hooks/use-event';
import { useDicomVolume } from '@/lib/hooks/use-dicom-volume';
import { MM_TO_SCENE_UNITS } from '@/lib/volume-utils';
import { VolumeSlices } from './volume-slices';
import { VolumeIsosurface } from './volume-isosurface';

type VolumeProps = SrcObj;

export const Volume = ({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }: VolumeProps) => {
  const { volumeRenderMode, volumeIsovalue } = useStore();
  const { volume, progress } = useDicomVolume(url);
  const triggerVolumeLoadingProgress = useEventTrigger(VOLUME_LOADING_PROGRESS);

  // Reports via a window CustomEvent, not the zustand store: this component lives inside Bounds,
  // which remounts on every store update (see VOLUME_PLAN.md), so a store write here would
  // re-render Scene, remount this component, and re-trigger the same write — a feedback loop.
  // No unmount cleanup, deliberately: a remount here doesn't mean the volume is gone, just that
  // Bounds cycled — firing "done" on unmount would signal completion mid-decode. Loader/
  // VolumeLoadWatcher (viewer.tsx) reset to their own default on remount instead, which already
  // covers the case where a volume is genuinely removed from the scene.
  useEffect(() => {
    triggerVolumeLoadingProgress(progress);
  }, [progress, triggerVolumeLoadingProgress]);

  // One full-resolution texture shared by both render modes — see VOLUME_PLAN.md section 9 for
  // why isosurface no longer gets its own downsampled/nearest-filtered copy.
  const texture = useMemo(() => {
    if (!volume) return null;
    const [x, y, z] = volume.dimensions;
    const tex = new Data3DTexture(volume.data, x, y, z);
    tex.format = RedFormat;
    tex.type = UnsignedByteType;
    tex.minFilter = tex.magFilter = LinearFilter;
    tex.wrapR = ClampToEdgeWrapping;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.unpackAlignment = 1;
    tex.needsUpdate = true;
    return tex;
  }, [volume]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  if (!volume || !texture) return null;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {volumeRenderMode === 'isosurface' ? (
        <VolumeIsosurface
          texture={texture}
          dimensions={volume.dimensions}
          voxelScale={volume.spacing.map((s) => s * MM_TO_SCENE_UNITS) as [number, number, number]}
          isovalue={volumeIsovalue}
        />
      ) : (
        <VolumeSlices volume={volume} texture={texture} />
      )}
    </group>
  );
};
