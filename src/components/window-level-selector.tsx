'use client';

import useStore from '@/Store';
import { SliderSelector } from './slider-selector';

export function WindowLevelSelector() {
  const { volumeWindowCenter, volumeWindowWidth, setVolumeWindowCenter, setVolumeWindowWidth } = useStore();

  return (
    <>
      <SliderSelector
        label="Window Center"
        description="Center of the pixel-value range mapped to visible contrast (brightness)."
        value={volumeWindowCenter}
        onChange={setVolumeWindowCenter}
        max={255}
        step={1}
      />
      <SliderSelector
        label="Window Width"
        description="Width of the pixel-value range mapped to visible contrast."
        value={volumeWindowWidth}
        onChange={setVolumeWindowWidth}
        max={510}
        step={1}
      />
    </>
  );
}
