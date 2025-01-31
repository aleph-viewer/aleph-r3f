import { create } from 'zustand';
import { Annotation, CameraMode, SrcObj, Mode, ObjectMeasurement, ScreenMeasurement, MeasurementMode } from './types/';
import { Euler } from 'three';
import { PresetsType } from '@react-three/drei/helpers/environment-assets';

// import { mountStoreDevtool } from 'simple-zustand-devtools';

type State = {
  ambientLightIntensity: number;
  annotations: Annotation[];
  axesEnabled: boolean;
  boundsEnabled: boolean;
  cameraMode: CameraMode;
  environmentMap: PresetsType
  gridEnabled: boolean;
  loading: boolean;
  measurementMode: MeasurementMode;
  measurementUnits: 'm' | 'mm';
  mode: Mode;
  objectMeasurements: ObjectMeasurement[];
  orthographicEnabled: boolean;
  rotationEuler: Euler;
  rotationXDegrees: number;
  rotationYDegrees: number;
  rotationZDegrees: number;
  sceneControlsEnabled: boolean;
  screenMeasurements: ScreenMeasurement[];
  selectedAnnotation: number | null;
  srcs: SrcObj[];
  setAmbientLightIntensity: (ambientLightIntensity: number) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  setAxesEnabled: (axesEnabled: boolean) => void;
  setBoundsEnabled: (boundsEnabled: boolean) => void;
  setCameraMode: (cameraMode: CameraMode) => void;
  setEnvironmentMap: (environmentMap: PresetsType) => void;
  setGridEnabled: (gridEnabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setMeasurementMode: (measurementMode: MeasurementMode) => void;
  setMeasurementUnits: (measurementUnits: 'm' | 'mm') => void;
  setMode: (mode: Mode) => void;
  setObjectMeasurements: (measurements: ObjectMeasurement[]) => void;
  setOrthographicEnabled: (orthographicEnabled: boolean) => void;
  setRotationEuler: (rotationEuler: Euler) => void;
  setRotationXDegrees: (rotationXDegrees: number) => void;
  setRotationYDegrees: (rotationYDegrees: number) => void;
  setRotationZDegrees: (rotationZDegrees: number) => void;
  setSceneControlsEnabled: (sceneControlsEnabled: boolean) => void;
  setScreenMeasurements: (measurements: ScreenMeasurement[]) => void;
  setSelectedAnnotation: (selectedAnnotation: number | null) => void;
  setSrcs: (srcs: SrcObj[]) => void;
};

const useStore = create<State>((set) => ({
  ambientLightIntensity: 0,
  annotations: [],
  axesEnabled: false,
  boundsEnabled: false,
  cameraMode: 'perspective',
  environmentMap: 'apartment',
  gridEnabled: false,
  loading: true,
  measurementMode: 'object',
  measurementUnits: 'm',
  mode: 'scene',
  objectMeasurements: [],
  orthographicEnabled: false,
  rotationEuler: new Euler(0, 0, 0),
  rotationXDegrees: 0.0,
  rotationYDegrees: 0.0,
  rotationZDegrees: 0.0,
  sceneControlsEnabled: false,
  screenMeasurements: [],
  selectedAnnotation: null,
  srcs: [],

  setAmbientLightIntensity: (ambientLightIntensity: number) =>
    set({
      ambientLightIntensity,
    }),

  setAnnotations: (annotations: Annotation[]) =>
    set({
      annotations,
    }),

  setAxesEnabled: (axesEnabled: boolean) =>
    set({
      axesEnabled,
    }),

  setBoundsEnabled: (boundsEnabled: boolean) =>
    set({
      boundsEnabled,
    }),

  setCameraMode: (cameraMode: CameraMode) => {
    set({
      cameraMode,
      orthographicEnabled: cameraMode === 'orthographic'
    })
  },

  setEnvironmentMap: (environmentMap: PresetsType) =>
    set({
      environmentMap,
    }),

  setGridEnabled: (gridEnabled: boolean) =>
    set({
      gridEnabled,
    }),

  setLoading: (loading: boolean) =>
    set({
      loading,
    }),

  setMeasurementMode: (measurementMode: MeasurementMode) => {
    set({
      measurementMode,
    });

    if (measurementMode === 'screen') {
      set({
        cameraMode: 'orthographic',
        orthographicEnabled: true
      })
    }
  },

  setMeasurementUnits: (measurementUnits: 'm' | 'mm') =>
    set({
      measurementUnits,
    }),

  setMode: (mode: Mode) =>
    set({
      mode,
    }),

  setObjectMeasurements: (measurements: ObjectMeasurement[]) =>
    set({
      objectMeasurements: measurements,
    }),

  setOrthographicEnabled: (orthographicEnabled: boolean) =>
    set({
      orthographicEnabled,
    }),

  setRotationEuler: (rotationEuler: Euler) =>
    set({
      rotationEuler,
    }),

  setRotationXDegrees: (rotationXDegrees: number) =>
    set({
      rotationXDegrees,
    }),

  setRotationYDegrees: (rotationYDegrees: number) =>
    set({
      rotationYDegrees,
    }),
  
  setRotationZDegrees: (rotationZDegrees: number) =>
    set({
      rotationZDegrees,
    }),

  setSceneControlsEnabled: (sceneControlsEnabled: boolean) => 
    set({
      sceneControlsEnabled,
    }),

  setScreenMeasurements: (measurements: ScreenMeasurement[]) =>
    set({
      screenMeasurements: measurements,
    }),

  setSelectedAnnotation: (selectedAnnotation: number | null) =>
    set({
      selectedAnnotation,
    }),

  setSrcs: (srcs: SrcObj[]) =>
    set({
      srcs,
      loading: true,
    }),
}));

// if (process.env.NODE_ENV === 'development') {
//   console.log('zustand devtools');
//   mountStoreDevtool('Store', useStore);
// }

export default useStore;
