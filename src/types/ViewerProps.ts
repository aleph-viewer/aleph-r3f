import { PresetsType } from '@react-three/drei/helpers/environment-assets';
import { SrcObj } from './index';

export type ViewerProps = {
  envPreset: PresetsType;
  onLoad?: (src: SrcObj[]) => void;
  src: string | SrcObj | SrcObj[];
};

export type ViewerRef = {
  recenter: (instant?: boolean) => void;
};
