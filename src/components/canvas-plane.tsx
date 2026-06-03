import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { BufferGeometry, DoubleSide, Float32BufferAttribute } from 'three';

type CanvasPlaneProps = {
  url: string;
  corners: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
};

/**
 * Renders a 2D Canvas as a flat quad mesh in 3D space.
 * corners: [TL, BL, BR, TR] in scene coordinates.
 * UV mapping: TL→(0,1), BL→(0,0), BR→(1,0), TR→(1,1).
 */
export const CanvasPlane = ({ url, corners }: CanvasPlaneProps) => {
  const [TL, BL, BR, TR] = corners;

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute(
      'position',
      new Float32BufferAttribute([...TL, ...BL, ...BR, ...TR], 3)
    );
    geo.setAttribute(
      'uv',
      new Float32BufferAttribute([
        0, 1,  // TL
        0, 0,  // BL
        1, 0,  // BR
        1, 1,  // TR
      ], 2)
    );
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    return geo;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...TL, ...BL, ...BR, ...TR]);

  const texture = useTexture(url);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial map={texture} side={DoubleSide} />
    </mesh>
  );
};
