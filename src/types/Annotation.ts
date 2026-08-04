import { Vector3 } from 'three';
import { Point } from './Point';

export type Annotation = Point & {
  cameraPosition?: Vector3;
  cameraTarget?: Vector3;
  cameraFieldOfView?: number;
  cameraNear?: number;
  cameraFar?: number;
  description?: string;
  label?: string;
};
