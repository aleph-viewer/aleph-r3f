import { VolumeData } from '@/types/Volume';

// DICOM spacing is in mm; scene units follow the existing GLTF convention of meters.
export const MM_TO_SCENE_UNITS = 0.001;

export function getVolumeSceneSize(volume: VolumeData): [number, number, number] {
  return [
    volume.dimensions[0] * volume.spacing[0] * MM_TO_SCENE_UNITS,
    volume.dimensions[1] * volume.spacing[1] * MM_TO_SCENE_UNITS,
    volume.dimensions[2] * volume.spacing[2] * MM_TO_SCENE_UNITS,
  ];
}
