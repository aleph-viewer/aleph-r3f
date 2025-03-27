'use client';

import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Box3, Group, Matrix4, Vector3 } from 'three';
import useStore from '@/Store';
import { applyMatrix4Inverse, calculateScreenPosition } from '@/lib/utils';

export function BoundsText({ 
  boundsRef, 
  rotationMatrixRef 
}: {
  boundsRef: React.MutableRefObject<Group | null>, 
  rotationMatrixRef: React.MutableRefObject<Matrix4>
}) {
  const { measurementUnits } = useStore();
  const { camera, size } = useThree();

  useFrame(() => {
    updateBoundsTextPositions();
  });

  if (!boundsRef.current) return;

  const v1 = new Vector3();

  const box = new Box3().setFromObject(boundsRef.current); // Calculate the bounding box
  const boxOrigin = new Vector3();
  box.getCenter(boxOrigin); // Get the center of the bounding box

  const dimensions = new Vector3();
  box.getSize(dimensions); // Get the dimensions (width, height, depth)

  const positionX = applyMatrix4Inverse(
    v1.set(boxOrigin.x, boxOrigin.y + dimensions.y / 2, boxOrigin.z + dimensions.z / 2),
    rotationMatrixRef.current
  );
  const positionY = applyMatrix4Inverse(
    v1.set(boxOrigin.x + dimensions.x / 2, boxOrigin.y, boxOrigin.z + dimensions.z / 2),
    rotationMatrixRef.current
  );
  const positionZ = applyMatrix4Inverse(
    v1.set(boxOrigin.x + dimensions.x / 2, boxOrigin.y + dimensions.y / 2, boxOrigin.z),
    rotationMatrixRef.current
  );
  
  function updateBoundsTextPosition(el: HTMLElement, pos: Vector3, offset: 'center' | 'left' | 'right' = 'center') {
    let offsetX = 0;
    let offsetY = 0;

    if (offset === 'center') {
      offsetX = -50;
      offsetY = -30;
    } else if (offset === 'left') {
      offsetX = -105;
      offsetY = -15;
    } else if (offset === 'right') {
      offsetX = 5;
      offsetY = -15;
    }

    const [x, y] = calculateScreenPosition(pos, rotationMatrixRef, camera, size);
    el.setAttribute('x', `${x + offsetX}`);
    el.setAttribute('y', `${y + offsetY}`);
  }

  function updateBoundsTextPositions() {
    const textX = document.getElementById('box-x');
    if (textX) updateBoundsTextPosition(textX, positionX);

    const textY = document.getElementById('box-y');
    if (textY) updateBoundsTextPosition(textY, positionY, 'right');

    const textZ = document.getElementById('box-z');
    if (textZ) updateBoundsTextPosition(textZ, positionZ);
  }

  function normalizeDim(dim: number) {
    dim = measurementUnits == 'mm' ? dim * 1000 : dim;
    return dim < 0.001 ? '<0.001' : dim.toFixed(3);
  }

  return (
    <Html
      zIndexRange={[50, 0]}
      calculatePosition={() => {
        return [0, 0];
      }}
      style={{
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}>
      <svg
        width="100vw"
        height="100vh"
      >
        <foreignObject id="box-z" className="measurement-label">
          <div className="text">
            <div className="label">{`${normalizeDim(dimensions.z)} ${measurementUnits}`}</div>                
          </div>
        </foreignObject>
        <foreignObject id="box-y" className="measurement-label">
          <div className="text">
            <div className="label">{`${normalizeDim(dimensions.y)} ${measurementUnits}`}</div>                
          </div>
        </foreignObject>
        <foreignObject id="box-x" className="measurement-label">
          <div className="text">
            <div className="label">{`${normalizeDim(dimensions.x)} ${measurementUnits}`}</div>                
          </div>
        </foreignObject>
      </svg>
    </Html>
  )
}