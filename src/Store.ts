import { create } from 'zustand';
import { Annotation, CameraMode, SrcObj, Mode, ObjectMeasurement, ScreenMeasurement, MeasurementMode, UpVector } from './types/';
// import { mountStoreDevtool } from 'simple-zustand-devtools';

type State = {
  ambientLightIntensity: number;
  annotations: Annotation[];
  axesEnabled: boolean;
  boundsEnabled: boolean;
  cameraMode: CameraMode;
  gridEnabled: boolean;
  loading: boolean;
  measurementMode: MeasurementMode;
  measurementUnits: 'm' | 'mm';
  mode: Mode;
  objectMeasurements: ObjectMeasurement[];
  orientation: UpVector;
  orthographicEnabled: boolean;
  pivotControlsEnabled: boolean;
  pivotX: number;
  pivotY: number;
  pivotZ: number;
  screenMeasurements: ScreenMeasurement[];
  selectedAnnotation: number | null;
  srcs: SrcObj[];
  upVector: UpVector;
  setAmbientLightIntensity: (ambientLightIntensity: number) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  setAxesEnabled: (axesEnabled: boolean) => void;
  setBoundsEnabled: (boundsEnabled: boolean) => void;
  setCameraMode: (cameraMode: CameraMode) => void;
  setGridEnabled: (gridEnabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setMeasurementMode: (measurementMode: MeasurementMode) => void;
  setMeasurementUnits: (measurementUnits: 'm' | 'mm') => void;
  setMode: (mode: Mode) => void;
  setObjectMeasurements: (measurements: ObjectMeasurement[]) => void;
  setOrientation: (orientation: UpVector) => void;
  setOrthographicEnabled: (orthographicEnabled: boolean) => void;
  setPivotControlsEnabled: (pivotControlsEnabled: boolean) => void;
  setPivotX: (pivotX: number) => void;
  setPivotY: (pivotY: number) => void;
  setPivotZ: (pivotZ: number) => void;
  setScreenMeasurements: (measurements: ScreenMeasurement[]) => void;
  setSelectedAnnotation: (selectedAnnotation: number | null) => void;
  setSrcs: (srcs: SrcObj[]) => void;
  setUpVector: (upVector: UpVector) => void;
};

const useStore = create<State>((set) => ({
  ambientLightIntensity: 0,
  annotations: [],
  axesEnabled: false,
  boundsEnabled: false,
  cameraMode: 'perspective',
  gridEnabled: false,
  loading: true,
  measurementMode: 'object',
  measurementUnits: 'm',
  mode: 'scene',
  objectMeasurements: [],
  orientation: 'y-positive',
  orthographicEnabled: false,
  pivotControlsEnabled: true,
  pivotX: 0.0,
  pivotY: 0.0,
  pivotZ: 0.0,
  screenMeasurements: [],
  selectedAnnotation: null,
  srcs: [],
  upVector: 'y-positive',

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

  setOrientation: (orientation: UpVector) =>
    set({
      orientation,
    }),

  setOrthographicEnabled: (orthographicEnabled: boolean) =>
    set({
      orthographicEnabled,
    }),

  setPivotControlsEnabled: (pivotControlsEnabled: boolean) =>
    set({
      pivotControlsEnabled,
    }),

  setPivotX: (pivotX: number) =>
    set({
      pivotX,
    }),

  setPivotY: (pivotY: number) =>
    set({
      pivotY,
    }),
  
  setPivotZ: (pivotZ: number) =>
    set({
      pivotZ,
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

  setUpVector: (upVector: UpVector) =>
    set({
      upVector,
    }),
}));

// if (process.env.NODE_ENV === 'development') {
//   console.log('zustand devtools');
//   mountStoreDevtool('Store', useStore);
// }

export default useStore;
