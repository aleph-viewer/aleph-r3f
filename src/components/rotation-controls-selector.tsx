'use client';

import useStore from '@/Store';
import { BooleanSelector } from './boolean-selector';

export function RotationControlsSelector() {
  const { rotationControlsEnabled, setRotationControlsEnabled } = useStore();

  return (
    <BooleanSelector
      label="Show Rotate Controls"
      description="Show or hide XYZ rotation controls."
      value={rotationControlsEnabled}
      onChange={setRotationControlsEnabled}
    />
  );
}
