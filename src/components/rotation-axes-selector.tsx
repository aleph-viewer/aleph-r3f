'use client';

import { Selector } from './selector';

import useStore from '@/Store';

export function RotationAxesSelector() {
  const { 
    rotationX,
    rotationY,
    rotationZ,
    setRotationX,
    setRotationY,
    setRotationZ,
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
            value={rotationX}
            maxLength={64}
            onChange={(e) => setRotationX(e.target.value) }
          />
          <input
            type="text"
            className="p-1 text-black w-full"
            value={rotationY}
            maxLength={64}
            onChange={(e) => setRotationY(e.target.value) }
          />
          <input
            type="text"
            className="p-1 text-black w-full"
            value={rotationZ}
            maxLength={64}
            onChange={(e) => setRotationZ(e.target.value) }
          />
        </div>
      </Selector>
  );
}
