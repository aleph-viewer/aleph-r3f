'use client';

import useStore from '@/Store';
import { OptionSelector } from './option-selector';

export function VolumeRenderModeSelector() {
  const { volumeRenderMode, setVolumeRenderMode } = useStore();

  return (
    <OptionSelector
      label="Volume Render Mode"
      description="Show cross-section slices through the volume, or an isosurface at a chosen threshold."
      value={volumeRenderMode}
      onChange={(value) => setVolumeRenderMode(value as 'slices' | 'isosurface')}
      options={[
        { value: 'slices', label: 'Slices' },
        { value: 'isosurface', label: 'Isosurface' },
      ]}
    />
  );
}
