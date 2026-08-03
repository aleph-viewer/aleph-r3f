'use client';

import useStore from '@/Store';
import { SliderSelector } from './slider-selector';

export function VolumeIsovalueSelector() {
  const { volumeIsovalue, setVolumeIsovalue } = useStore();

  return (
    <SliderSelector
      label="Isovalue"
      description="Pixel-value threshold used to extract the isosurface from the volume."
      value={volumeIsovalue}
      onChange={setVolumeIsovalue}
      max={255}
      step={1}
    />
  );
}
