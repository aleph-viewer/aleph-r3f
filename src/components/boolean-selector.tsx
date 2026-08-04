'use client';

import { Selector } from './selector';
import { Switch } from './ui/switch';

export function BooleanSelector({
  label,
  description,
  disabled,
  value,
  onChange,
}: {
  label: string;
  description: string;
  disabled?: boolean;
  value: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Selector 
      label={label} 
      description={description} 
      inline={true}
    >
      <Switch
        checked={value}
        disabled={disabled}
        onCheckedChange={(checked: boolean) => {
          onChange(checked);
        }}
      />
    </Selector>
  );
}
