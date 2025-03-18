import { PresetsType } from '@react-three/drei/helpers/environment-assets';
import { Annotation, SrcObj } from './index';

export type ViewerProps = {
  annotations?: Annotation[];
  environmentMap?: PresetsType;
  onLoad?: (src: SrcObj[]) => void;
  src: string | SrcObj | SrcObj[];
  rotationPreset?: [number, number, number];
};

export type ViewerRef = {
  recenter: (instant?: boolean) => void;
};
