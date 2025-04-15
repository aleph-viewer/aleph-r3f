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
};

export type SrcCollections = {
  label: string,
  src: Src,
}[];

// R3F types are easier to handle from a variety of input formats, e.g. with Src
// During Src loading they get converted to Three.js types
export type SrcAnnotation = {
  normal?: Vector3;
  position?: Vector3;
  cameraPosition?: Vector3;
  cameraTarget?: Vector3;
  description?: string;
  label?: string;
};