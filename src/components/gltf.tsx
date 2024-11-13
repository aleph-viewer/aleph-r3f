import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
// import { a } from '@react-spring/three';
import { Euler, Group } from 'three';
import { UpVector } from '@/types';
import { SrcObj } from '@/types/Src';

type GLTFProps = SrcObj & {
  orientation?: UpVector;
  onLoad?: (url: string) => void;
};

export const GLTF = ({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], orientation, onLoad }: GLTFProps) => {
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

  console.log('drawing gltf');
  console.log(orientation);

  const rotationEuler = new Euler(0, 0, 0);
  if (orientation && orientation != 'y-positive') {
    const orientationToEulerAngles = {
      'y-positive': [0, 0, 0], // default rotation, points "up"
      'y-negative': [0, 0, Math.PI], // rotate 180 degrees around Z ccw, points "down"
      'z-positive': [-Math.PI/2, 0, 0], // rotate 90 degrees around X ccw, points "back"
      'z-negative': [Math.PI/2, 0, 0] // rotate 270 degrees around X ccw, points "forward"
    };
    rotationEuler.fromArray(orientationToEulerAngles[orientation] as [number, number, number])
  }

  return (
    <>
      {/* @ts-ignore: https://github.com/pmndrs/react-spring/issues/1515 */}
      <group ref={ref} position={position} rotation={rotationEuler} scale={scale}>
        <primitive ref={modelRef} object={scene} scale={scale} />
      </group>
    </>
  );
};
