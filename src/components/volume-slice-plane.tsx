import { useEffect, useMemo } from 'react';
import { BufferGeometry, Data3DTexture, DoubleSide, Float32BufferAttribute, GLSL3, ShaderMaterial } from 'three';

const vertexShader = `
  attribute vec3 texCoord;
  varying vec3 vTexCoord;

  void main() {
    vTexCoord = texCoord;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  precision highp sampler3D;

  uniform sampler3D map;
  uniform float windowCenter;
  uniform float windowWidth;
  varying vec3 vTexCoord;
  out vec4 fragColor;

  void main() {
    // texture() on a normalized UnsignedByteType 3D texture returns [0,1], not the raw 0-255
    // byte; windowCenter/windowWidth are expressed in raw pixel-value units (DICOM convention),
    // so scale back up before applying them.
    float intensity = texture(map, vTexCoord).r * 255.0;
    float low = windowCenter - windowWidth * 0.5;
    float windowed = clamp((intensity - low) / max(windowWidth, 0.0001), 0.0, 1.0);
    fragColor = vec4(vec3(windowed), 1.0);
  }
`;

// The two volume dimensions each axis plane spans, always in this (width, height) order. Both the
// quad's vertex positions and its texture coordinates are built from this same mapping below, so
// the plane can never sample a different location than where it's actually drawn.
const AXIS_DIMS: { [key in 0 | 1 | 2]: { widthDim: 0 | 1 | 2; heightDim: 0 | 1 | 2 } } = {
  0: { widthDim: 1, heightDim: 2 }, // X fixed: spans Y, Z
  1: { widthDim: 0, heightDim: 2 }, // Y fixed: spans X, Z
  2: { widthDim: 0, heightDim: 1 }, // Z fixed: spans X, Y
};

const QUAD_CORNERS: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

type VolumeSlicePlaneProps = {
  axis: 0 | 1 | 2;
  texture: Data3DTexture;
  size: [number, number, number];
  slicePosition: number;
  windowCenter: number;
  windowWidth: number;
};

export const VolumeSlicePlane = ({
  axis,
  texture,
  size,
  slicePosition,
  windowCenter,
  windowWidth,
}: VolumeSlicePlaneProps) => {
  const { widthDim, heightDim } = AXIS_DIMS[axis];
  const [sizeX, sizeY, sizeZ] = size;

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const texCoords: number[] = [];

    const size: [number, number, number] = [sizeX, sizeY, sizeZ];

    for (const [w, h] of QUAD_CORNERS) {
      const position: [number, number, number] = [0, 0, 0];
      const texCoord: [number, number, number] = [0, 0, 0];

      position[widthDim] = (w - 0.5) * size[widthDim];
      position[heightDim] = (h - 0.5) * size[heightDim];
      position[axis] = (slicePosition - 0.5) * size[axis];

      texCoord[widthDim] = w;
      texCoord[heightDim] = h;
      texCoord[axis] = slicePosition;

      positions.push(...position);
      texCoords.push(...texCoord);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('texCoord', new Float32BufferAttribute(texCoords, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    return geo;
  }, [axis, widthDim, heightDim, sizeX, sizeY, sizeZ, slicePosition]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    return new ShaderMaterial({
      glslVersion: GLSL3,
      side: DoubleSide,
      uniforms: {
        map: { value: texture },
        windowCenter: { value: windowCenter },
        windowWidth: { value: windowWidth },
      },
      vertexShader,
      fragmentShader,
    });
    // windowCenter/windowWidth are seeded here but kept live via the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);

  useEffect(() => {
    material.uniforms.windowCenter.value = windowCenter;
    material.uniforms.windowWidth.value = windowWidth;
  }, [material, windowCenter, windowWidth]);

  useEffect(() => () => material.dispose(), [material]);

  return <mesh geometry={geometry} material={material} />;
};
