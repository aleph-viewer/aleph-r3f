import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { BackSide, BoxGeometry, Data3DTexture, DataTexture, RGBAFormat, ShaderMaterial, Vector2, Vector3 } from 'three';

// Ported near-verbatim from three.js's examples/jsm/shaders/VolumeShader.js (VolumeRenderShader1).
const MAX_STEPS = 1400; // covers the worst-case ray diagonal through this volume's shape (up to ~1400 voxels)

const vertexShader = `
  varying vec3 v_position;
  varying vec3 v_cameraInObj;
  varying vec3 v_viewDirInObj;

  void main() {
    vec4 position4 = vec4(position, 1.0);
    v_position = position;
    v_cameraInObj = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    v_viewDirInObj = (inverse(modelViewMatrix) * vec4(0.0, 0.0, -1.0, 0.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * position4;
  }
`;

const fragmentShader = `
  precision highp float;
  precision mediump sampler3D;

  uniform vec3 u_size;
  uniform int u_renderstyle;
  uniform float u_renderthreshold;
  uniform vec2 u_clim;
  uniform sampler3D u_data;
  uniform sampler2D u_cmdata;

  varying vec3 v_position;
  varying vec3 v_cameraInObj;
  varying vec3 v_viewDirInObj;

  const int MAX_STEPS = ${MAX_STEPS};
  const int REFINEMENT_STEPS = 4;
  const float relative_step_size = 1.0;
  const float shininess = 40.0;

  void cast_mip(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray);
  void cast_iso(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray);
  float sample1(vec3 texcoords);
  vec4 apply_colormap(float val);
  vec4 add_lighting(float val, vec3 loc, vec3 step, vec3 view_ray);

  void main() {
    vec3 view_ray = isOrthographic
      ? normalize(-v_viewDirInObj)
      : normalize(v_cameraInObj - v_position);

    vec3 t1 = (vec3(-0.5) - v_position) / view_ray;
    vec3 t2 = (u_size - vec3(0.5) - v_position) / view_ray;
    vec3 tmax = max(t1, t2);
    float distance = min(min(tmax.x, tmax.y), tmax.z);

    int nsteps = int(distance / relative_step_size + 0.5);
    if (nsteps < 1) discard;

    vec3 front = v_position + view_ray * distance;
    vec3 step = ((v_position - front) / u_size) / float(nsteps);
    vec3 start_loc = front / u_size;

    if (u_renderstyle == 0) cast_mip(start_loc, step, nsteps, view_ray);
    else cast_iso(start_loc, step, nsteps, view_ray);

    if (gl_FragColor.a < 0.05) discard;
  }

  float sample1(vec3 texcoords) {
    return texture(u_data, texcoords.xyz).r;
  }

  vec4 apply_colormap(float val) {
    val = (val - u_clim[0]) / (u_clim[1] - u_clim[0]);
    float n = float(textureSize(u_cmdata, 0).x);
    val = (val * (n - 1.0) + 0.5) / n;
    return texture2D(u_cmdata, vec2(val, 0.5));
  }

  void cast_mip(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray) {
    float max_val = -1e6;
    int max_i = 100;
    vec3 loc = start_loc;

    for (int iter = 0; iter < MAX_STEPS; iter++) {
      if (iter >= nsteps) break;
      float val = sample1(loc);
      if (val > max_val) {
        max_val = val;
        max_i = iter;
      }
      loc += step;
    }

    vec3 iloc = start_loc + step * (float(max_i) - 0.5);
    vec3 istep = step / float(REFINEMENT_STEPS);
    for (int i = 0; i < REFINEMENT_STEPS; i++) {
      max_val = max(max_val, sample1(iloc));
      iloc += istep;
    }

    gl_FragColor = apply_colormap(max_val);
  }

  void cast_iso(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray) {
    gl_FragColor = vec4(0.0);
    vec3 dstep = 1.5 / u_size;
    vec3 loc = start_loc;

    float low_threshold = u_renderthreshold - 0.02 * (u_clim[1] - u_clim[0]);

    for (int iter = 0; iter < MAX_STEPS; iter++) {
      if (iter >= nsteps) break;

      float val = sample1(loc);

      if (val > low_threshold) {
        vec3 iloc = loc - 0.5 * step;
        vec3 istep = step / float(REFINEMENT_STEPS);
        for (int i = 0; i < REFINEMENT_STEPS; i++) {
          val = sample1(iloc);
          if (val > u_renderthreshold) {
            gl_FragColor = add_lighting(val, iloc, dstep, view_ray);
            return;
          }
          iloc += istep;
        }
      }

      loc += step;
    }
  }

  vec4 add_lighting(float val, vec3 loc, vec3 step, vec3 view_ray) {
    vec3 V = normalize(view_ray);

    vec3 N;
    float val1, val2;
    val1 = sample1(loc + vec3(-step[0], 0.0, 0.0));
    val2 = sample1(loc + vec3(+step[0], 0.0, 0.0));
    N[0] = val1 - val2;
    val = max(max(val1, val2), val);
    val1 = sample1(loc + vec3(0.0, -step[1], 0.0));
    val2 = sample1(loc + vec3(0.0, +step[1], 0.0));
    N[1] = val1 - val2;
    val = max(max(val1, val2), val);
    val1 = sample1(loc + vec3(0.0, 0.0, -step[2]));
    val2 = sample1(loc + vec3(0.0, 0.0, +step[2]));
    N[2] = val1 - val2;
    val = max(max(val1, val2), val);

    N = normalize(N);
    float Nselect = float(dot(N, V) > 0.0);
    N = (2.0 * Nselect - 1.0) * N;

    vec4 ambient_color = vec4(0.0);
    vec4 diffuse_color = vec4(0.0);
    vec4 specular_color = vec4(0.0);

    vec3 L = normalize(view_ray);
    float lightEnabled = float(length(L) > 0.0);
    L = normalize(L + (1.0 - lightEnabled));

    float lambertTerm = clamp(dot(N, L), 0.0, 1.0);
    vec3 H = normalize(L + V);
    float specularTerm = pow(max(dot(H, N), 0.0), shininess);

    float mask1 = lightEnabled;
    ambient_color += mask1 * ambient_color;
    diffuse_color += mask1 * lambertTerm;
    specular_color += mask1 * specularTerm * specular_color;

    vec4 color = apply_colormap(val);
    vec4 final_color = color * (ambient_color + diffuse_color) + specular_color;
    final_color.a = color.a;
    return final_color;
  }
`;

// Grayscale ramp colormap, shared across every instance — intensity indexes into this rather than shading directly.
const grayscaleColormap = (() => {
  const data = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    data[i * 4] = i;
    data[i * 4 + 1] = i;
    data[i * 4 + 2] = i;
    data[i * 4 + 3] = 255;
  }
  const tex = new DataTexture(data, 256, 1, RGBAFormat);
  tex.needsUpdate = true;
  return tex;
})();

type VolumeRaycastProps = {
  texture: Data3DTexture;
  dimensions: [number, number, number];
  voxelScale: [number, number, number];
  renderStyle: 'mip' | 'iso';
  isovalue: number; // real (rescaled) pixel-value units, matching the volume's own data range; ignored for mip
  dataMin: number; // real (rescaled) pixel-value units — colormap/MIP display range
  dataMax: number;
};

export const VolumeRaycast = ({ texture, dimensions, voxelScale, renderStyle, isovalue, dataMin, dataMax }: VolumeRaycastProps) => {
  const invalidate = useThree((state) => state.invalidate);
  const [dimX, dimY, dimZ] = dimensions;

  // Voxel-index space, not a unit cube — the shader's ray math expects v_position/u_size to match.
  const geometry = useMemo(() => {
    const geo = new BoxGeometry(dimX, dimY, dimZ);
    geo.translate(dimX / 2 - 0.5, dimY / 2 - 0.5, dimZ / 2 - 0.5);
    return geo;
  }, [dimX, dimY, dimZ]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    return new ShaderMaterial({
      side: BackSide,
      uniforms: {
        u_size: { value: new Vector3(dimX, dimY, dimZ) },
        u_renderstyle: { value: renderStyle === 'mip' ? 0 : 1 },
        u_renderthreshold: { value: isovalue },
        u_clim: { value: new Vector2(dataMin, dataMax) },
        u_data: { value: texture },
        u_cmdata: { value: grayscaleColormap },
      },
      vertexShader,
      fragmentShader,
    });
    // renderStyle/isovalue are seeded here but kept live via the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, dimX, dimY, dimZ, dataMin, dataMax]);

  useEffect(() => {
    material.uniforms.u_renderstyle.value = renderStyle === 'mip' ? 0 : 1;
    material.uniforms.u_renderthreshold.value = isovalue;
    // Uniform mutation bypasses R3F's prop-change tracking, so demand-mode frameloop (see
    // viewer.tsx) won't pick it up on its own.
    invalidate();
  }, [material, renderStyle, isovalue, invalidate]);

  useEffect(() => () => material.dispose(), [material]);

  // Recenters at the origin — the geometry itself sits corner-near-origin, per the ray math above.
  const centerOffset: [number, number, number] = [
    (-dimX / 2) * voxelScale[0],
    (-dimY / 2) * voxelScale[1],
    (-dimZ / 2) * voxelScale[2],
  ];

  return <mesh geometry={geometry} material={material} scale={voxelScale} position={centerOffset} />;
};
