'use client';

import { Slider } from './ui/slider';
import { Selector } from './selector';

export function SliderSelector({
  label,
  description,
  value,
  onChange,
  max = 1,
  step = 0.1,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  step?: number;
}) {
  const id: string = Math.random().toString(36).substring(2, 15); // Generate a unique ID

  return (
    <Selector label={label} description={description}>
      <Slider
        id={id}
        max={max}
        value={[value]}
        step={step}
        onValueChange={(value: number[]) => {
          onChange(value[0]);
        }}
        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        aria-label={label}
      />
    </Selector>
  );
}
