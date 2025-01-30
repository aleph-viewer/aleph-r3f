'use client';

import { InputSelector } from './input-selector';
import { Label } from './ui/label';
import useStore from '@/Store';

export function RotationAxesSelector() {
  const { 
    rotationXDegrees,
    rotationYDegrees,
    rotationZDegrees,
    setRotationXDegrees,
    setRotationYDegrees,
    setRotationZDegrees,
   } = useStore();

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex items-center justify-between">
        <Label className={ `text-white whitespace-normal` }>Rotation</Label>
      </div>
      <InputSelector
        label="X"
        description="Set rotation around the X axis in degrees."
        type="number"
        value={rotationXDegrees}
        onChange={(value) => setRotationXDegrees(value as number)}
      />
      <InputSelector
        label="Y"
        description="Set rotation around the Y axis in degrees."
        type="number"
        value={rotationYDegrees}
        onChange={(value) => setRotationYDegrees(value as number)}
      />
      <InputSelector
        label="Z"
        description="Set rotation around the Z axis in degrees."
        type="number"
        value={rotationZDegrees}
        onChange={(value) => setRotationZDegrees(value as number)}
      />
    </div>
  );
}
