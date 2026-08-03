'use client';

import useStore from '@/Store';
import { BooleanSelector } from './boolean-selector';
import { SliderSelector } from './slider-selector';

export function VolumeSliceSelector() {
  const {
    volumeSliceXEnabled,
    volumeSliceYEnabled,
    volumeSliceZEnabled,
    volumeSliceXPosition,
    volumeSliceYPosition,
    volumeSliceZPosition,
    setVolumeSliceXEnabled,
    setVolumeSliceYEnabled,
    setVolumeSliceZEnabled,
    setVolumeSliceXPosition,
    setVolumeSliceYPosition,
    setVolumeSliceZPosition,
  } = useStore();

  return (
    <div className="flex flex-col gap-4">
      <BooleanSelector
        label="X Slice"
        description="Show or hide the cross-section slice along the X axis."
        value={volumeSliceXEnabled}
        onChange={setVolumeSliceXEnabled}
      />
      {volumeSliceXEnabled && (
        <SliderSelector
          label="X Position"
          description="Position of the X-axis slice through the volume."
          value={volumeSliceXPosition}
          onChange={setVolumeSliceXPosition}
          step={0.001}
        />
      )}
      <BooleanSelector
        label="Y Slice"
        description="Show or hide the cross-section slice along the Y axis."
        value={volumeSliceYEnabled}
        onChange={setVolumeSliceYEnabled}
      />
      {volumeSliceYEnabled && (
        <SliderSelector
          label="Y Position"
          description="Position of the Y-axis slice through the volume."
          value={volumeSliceYPosition}
          onChange={setVolumeSliceYPosition}
          step={0.001}
        />
      )}
      <BooleanSelector
        label="Z Slice"
        description="Show or hide the cross-section slice along the Z axis."
        value={volumeSliceZEnabled}
        onChange={setVolumeSliceZEnabled}
      />
      {volumeSliceZEnabled && (
        <SliderSelector
          label="Z Position"
          description="Position of the Z-axis slice through the volume."
          value={volumeSliceZPosition}
          onChange={setVolumeSliceZPosition}
          step={0.001}
        />
      )}
    </div>
  );
}
