import { Euler, Vector3 } from '@react-three/fiber';

export type Src = string | SrcObj | SrcObj[];

export type SrcObj = {
  label?: string;
  position?: Vector3;
  rotation?: Euler;
  scale?: Vector3;
  requiredStatement?: string;
  url: string;
  annotations?: SrcAnnotation[];
  type?: 'model' | 'canvas' | 'volume';
  corners?: [[number, number, number], [number, number, number], [number, number, number], [number, number, number]];
};

export type SrcCollections = {
  label: string;
  src: Src;
  initialCameraConfig?: InitialCameraConfig;
}[];

// R3F types are easier to handle from a variety of input formats, e.g. with Src
// During Src loading they get converted to Three.js types
export type SrcAnnotation = {
  normal?: Vector3;
  position?: Vector3;
  cameraPosition?: Vector3;
  cameraTarget?: Vector3;
  cameraFieldOfView?: number;
  cameraNear?: number;
  cameraFar?: number;
  description?: string;
  label?: string;
};

export type InitialCameraConfig = {
  cameraType?: 'perspective' | 'orthographic';
  position?: [number, number, number];
  target?: [number, number, number];
  fieldOfView?: number;
  viewHeight?: number;
  near?: number;
  far?: number;
  interactionMode?: string[];
};