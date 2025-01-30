'use client';

import useStore from '@/Store';
import { BooleanSelector } from './boolean-selector';

export function BoundsSelector() {
  const { boundsEnabled, setBoundsEnabled } = useStore();

  return (
    <BooleanSelector
      label="Show Bounding Box"
      description="Show or hide bounding box surrounding content."
      value={boundsEnabled}
      onChange={setBoundsEnabled}
    />
  );
}
