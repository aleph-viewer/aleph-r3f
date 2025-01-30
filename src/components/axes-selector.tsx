'use client';

import useStore from '@/Store';
import { BooleanSelector } from './boolean-selector';

export function AxesSelector() {
  const { axesEnabled, setAxesEnabled } = useStore();

  return (
    <BooleanSelector
      label="Show Axes"
      description="Show or hide scene XYZ axis display and controls."
      value={axesEnabled}
      onChange={setAxesEnabled}
    />
  );
}
