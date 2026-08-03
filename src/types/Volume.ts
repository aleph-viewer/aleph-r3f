export type VolumeData = {
  // [x (columns), y (rows), z (frames)]
  dimensions: [number, number, number];
  // [x, y, z] in mm
  spacing: [number, number, number];
  // flattened, row-major, x fastest then y then z; length = dimensions[0]*dimensions[1]*dimensions[2]
  data: Uint8Array;
  min: number;
  max: number;
};
