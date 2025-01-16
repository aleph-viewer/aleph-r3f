'use client';

import { Selector } from './selector';

import useStore from '@/Store';

export function PivotAxesSelector() {
  const { 
    pivotX,
    pivotY,
    pivotZ,
    setPivotX,
    setPivotY,
    setPivotZ,
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
            value={pivotX}
            maxLength={64}
            onChange={(e) => setPivotX(e.target.value) }
          />
          <input
            type="text"
            className="p-1 text-black w-full"
            value={pivotY}
            maxLength={64}
            onChange={(e) => setPivotY(e.target.value) }
          />
          <input
            type="text"
            className="p-1 text-black w-full"
            value={pivotZ}
            maxLength={64}
            onChange={(e) => setPivotZ(e.target.value) }
          />
        </div>
      </Selector>
  );
}
