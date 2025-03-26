import { Euler, Vector3 } from '@react-three/fiber';
import { Annotation } from './Annotation';

export type Src = string | SrcObj | SrcObj[];

export type SrcObj = {
  label?: string;
  position?: Vector3;
  rotation?: Euler;
  scale?: Vector3;
  requiredStatement?: string;
  url: string;
  annotations?: Annotation[];
};

export type SrcCollections = {
  label: string,
  src: Src,
}[];