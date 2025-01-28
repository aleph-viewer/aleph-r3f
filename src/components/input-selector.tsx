'use client';

import { Selector } from './selector';

export function InputSelector({
  label,
  description,
  disabled,
  value,
  onChange,
}: {
  label: string;
  description: string;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Selector 
      label={label} 
      description={description} 
      inline={true} 
      noPaddingTop={true}
    >
      <input
        type="text"
        className="p-1 text-black w-full"
        defaultValue={value}
        disabled={disabled}
        maxLength={64}
        onChange={(e) => {
          console.log('changed');
          onChange(value);
        }}
      />
    </Selector>
  );
}
