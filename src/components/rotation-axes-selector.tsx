'use client';

import { Selector } from './selector';

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
      <Selector 
        label=""
        description="Set rotation X/Y/Z"
        inline={true} 
        noPaddingTop={true}
      >
        <div className="flex flex-row gap-4">
          <input
            type="text"
            className="p-1 text-black w-full"
            value={rotationXDegrees}
            maxLength={64}
            onChange={(e) => setRotationXDegrees(e.target.value) }
          />
          <input
            type="text"
            className="p-1 text-black w-full"
            value={rotationYDegrees}
            maxLength={64}
            onChange={(e) => setRotationYDegrees(e.target.value) }
          />
          <input
            type="text"
            className="p-1 text-black w-full"
            value={rotationZDegrees}
            maxLength={64}
            onChange={(e) => setRotationZDegrees(e.target.value) }
          />
        </div>
      </Selector>
  );
}
