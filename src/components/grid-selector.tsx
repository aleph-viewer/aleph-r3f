'use client';

import useStore from '@/Store';
import { BooleanSelector } from './boolean-selector';

export function GridSelector() {
  const { gridEnabled, setGridEnabled } = useStore();

  return (
    <BooleanSelector label="Show Grid" description="Show or hide coordinate grid." value={gridEnabled} onChange={setGridEnabled} />
  );
}
