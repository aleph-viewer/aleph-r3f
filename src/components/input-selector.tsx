'use client';

import { Selector } from './selector';

export function InputSelector({
  label,
  description,
  disabled,
  type,
  value,
  onChange,
}: {
  label: string;
  description: string;
  disabled?: boolean;
  type?: string;
  value: string | number;
  onChange: (value: string | number) => void;
}) {
  return (
    <Selector 
      label={label} 
      description={description} 
      inline={true} 
      labelPadding={true}
      noPaddingTop={true}
    >
      <input
        type={type || "text"}
        className="p-1 text-black w-full"
        value={value}
        disabled={disabled}
        maxLength={64}
        onChange={(e) => { onChange(e.target.value);
        }}
      />
    </Selector>
  );
}
