import { MutableRefObject, useMemo, useRef } from 'react';
import { Data3DTexture, Mesh } from 'three';
import useStore from '@/Store';
import { VolumeData } from '@/types/Volume';
import { getVolumeSceneSize } from '@/lib/volume-utils';
import { VolumeSlicePlane } from './volume-slice-plane';
import { VolumeSliceHandles } from './volume-slice-handles';

type VolumeSlicesProps = {
  volume: VolumeData;
  texture: Data3DTexture;
};

export const VolumeSlices = ({ volume, texture }: VolumeSlicesProps) => {
  const {
    volumeSliceXEnabled,
    volumeSliceYEnabled,
    volumeSliceZEnabled,
    volumeSliceXPosition,
    volumeSliceYPosition,
    volumeSliceZPosition,
    volumeWindowCenter,
    volumeWindowWidth,
  } = useStore();

  const size = useMemo(() => getVolumeSceneSize(volume), [volume]);

  const xPlaneRef = useRef<Mesh>(null!);
  const yPlaneRef = useRef<Mesh>(null!);
  const zPlaneRef = useRef<Mesh>(null!);

  const occludeRefs = [
    volumeSliceXEnabled && xPlaneRef,
    volumeSliceYEnabled && yPlaneRef,
    volumeSliceZEnabled && zPlaneRef,
  ].filter((ref): ref is MutableRefObject<Mesh> => !!ref);

  return (
    <group>
      {volumeSliceXEnabled && (
        <VolumeSlicePlane
          ref={xPlaneRef}
          axis={0}
          texture={texture}
          size={size}
          slicePosition={volumeSliceXPosition}
          windowCenter={volumeWindowCenter}
          windowWidth={volumeWindowWidth}
        />
      )}
      {volumeSliceYEnabled && (
        <VolumeSlicePlane
          ref={yPlaneRef}
          axis={1}
          texture={texture}
          size={size}
          slicePosition={volumeSliceYPosition}
          windowCenter={volumeWindowCenter}
          windowWidth={volumeWindowWidth}
        />
      )}
      {volumeSliceZEnabled && (
        <VolumeSlicePlane
          ref={zPlaneRef}
          axis={2}
          texture={texture}
          size={size}
          slicePosition={volumeSliceZPosition}
          windowCenter={volumeWindowCenter}
          windowWidth={volumeWindowWidth}
        />
      )}
      <VolumeSliceHandles size={size} occludeRefs={occludeRefs} />
    </group>
  );
};
