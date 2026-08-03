'use client';

import useStore from '@/Store';
import { VolumeRenderMode } from '@/types/Volume';
import { OptionSelector } from './option-selector';

export function VolumeRenderModeSelector() {
  const { volumeRenderMode, setVolumeRenderMode } = useStore();

  return (
    <OptionSelector
      label="Volume Render Mode"
      description="Show cross-section slices, an isosurface at a chosen threshold, or a maximum intensity projection."
      value={volumeRenderMode}
      onChange={(value) => setVolumeRenderMode(value as VolumeRenderMode)}
      options={[
        { value: 'slices', label: 'Slices' },
        { value: 'isosurface', label: 'Isosurface' },
        { value: 'mip', label: 'MIP' },
      ]}
    />
  );
}
