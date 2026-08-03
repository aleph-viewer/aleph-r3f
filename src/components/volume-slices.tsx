import { useMemo } from 'react';
import { Data3DTexture } from 'three';
import useStore from '@/Store';
import { VolumeData } from '@/types/Volume';
import { getVolumeSceneSize } from '@/lib/volume-utils';
import { VolumeSlicePlane } from './volume-slice-plane';

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

  return (
    <group>
      {volumeSliceXEnabled && (
        <VolumeSlicePlane
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
          axis={2}
          texture={texture}
          size={size}
          slicePosition={volumeSliceZPosition}
          windowCenter={volumeWindowCenter}
          windowWidth={volumeWindowWidth}
        />
      )}
    </group>
  );
};
