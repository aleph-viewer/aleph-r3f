export type VolumeRenderMode = 'slices' | 'isosurface' | 'mip';

export type VolumeData = {
  // [x (columns), y (rows), z (frames)]
  dimensions: [number, number, number];
  // [x, y, z] in mm
  spacing: [number, number, number];
  // Half-float bit patterns of rescaled real-world values (not raw sample values), flattened,
  // row-major, x fastest then y then z; length = dimensions[0]*dimensions[1]*dimensions[2].
  data: Uint16Array;
  // min/max in the same rescaled real-world units as `data`.
  min: number;
  max: number;
};
