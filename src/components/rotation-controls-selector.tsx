'use client';

import useStore from '@/Store';
import { BooleanSelector } from './boolean-selector';

export function RotationControlsSelector() {
  const { rotationControlsEnabled, setRotationControlsEnabled } = useStore();

  return (
    <BooleanSelector
      label="Rotation Controls"
      description="Enable/disable rotation controls."
      value={rotationControlsEnabled}
      onChange={setRotationControlsEnabled}
    />
  );
}
