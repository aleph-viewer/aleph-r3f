'use client';

import useStore from '@/Store';
import { BooleanSelector } from './boolean-selector';

export function PivotControlsSelector() {
  const { pivotControlsEnabled, setPivotControlsEnabled } = useStore();

  return (
    <BooleanSelector
      label="Pivot Controls"
      description="Enable/disable pivot controls."
      value={pivotControlsEnabled}
      onChange={setPivotControlsEnabled}
    />
  );
}
