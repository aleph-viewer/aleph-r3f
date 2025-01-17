import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
// import { a } from '@react-spring/three';
import { Group } from 'three';
import { SrcObj } from '@/types/Src';

type GLTFProps = SrcObj & {
  onLoad?: (url: string) => void;
};

export const GLTF = ({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], onLoad }: GLTFProps) => {
  const { scene } = useGLTF(url, true, true, (e) => {
    // @ts-ignore
    e.manager.onLoad = () => {
      if (onLoad) {
        onLoad(url);
      }
    };
  });
  const ref = useRef<Group | null>(null);
  const modelRef = useRef();

  return (
    <>
      {/* @ts-ignore: https://github.com/pmndrs/react-spring/issues/1515 */}
      <group ref={ref} position={position} rotation={rotation} scale={scale}>
        <primitive ref={modelRef} object={scene} scale={scale} />
      </group>
    </>
  );
};
