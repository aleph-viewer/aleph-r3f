import { PresetsType } from '@react-three/drei/helpers/environment-assets';
import { Src, SrcCollections, SrcObj } from './index';

type BaseViewerProps = {
  environmentMap?: PresetsType;
  measurementUnits?: 'm' | 'mm';
  onLoad?: (src: SrcObj[]) => void;
  rotationPreset?: [number, number, number];
};

type ViewerPropsWithSrc = BaseViewerProps & {
  src: Src;
  srcCollections?: never;
};

type ViewerPropsWithSrcCollections = BaseViewerProps & {
  src?: never;
  srcCollections: SrcCollections;
};

export type ViewerProps = ViewerPropsWithSrc | ViewerPropsWithSrcCollections;

export type ViewerRef = {
  recenter: (instant?: boolean) => void;
};
