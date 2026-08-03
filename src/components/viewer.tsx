import '@/viewer.css';
import '../index.css';
import React, { RefObject, Suspense, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GLTF } from '@/components/gltf';
import {
  CameraControls,
  Environment,
  GizmoHelper,
  GizmoViewport,
  Html,
  OrthographicCamera,
  PerspectiveCamera,
  PivotControls,
  useProgress,
} from '@react-three/drei';
import { BoxHelper, Group, Object3D, Vector3, Matrix4, Sphere, OrthographicCamera as ThreeOrthographicCamera } from 'three';
import useStore from '@/Store';
import {
  ViewerProps as ViewerProps,
  CAMERA_LOADING_DONE,
  CAMERA_UPDATE,
  DBL_CLICK,
  Mode,
  CameraRefs,
  DRAGGING_MEASUREMENT,
  DROPPED_MEASUREMENT,
  DRAGGING_VOLUME_HANDLE,
  DROPPED_VOLUME_HANDLE,
  RECENTER,
  CAMERA_CONTROLS_ENABLED,
  Src,
  SrcAnnotation,
  SrcObj,
  JSON_EMIT_REQUEST,
  JSON_EMIT,
  VOLUME_LOADING_PROGRESS,
} from '@/types';
import { useEventListener, useEventTrigger } from '@/lib/hooks/use-event';
import useTimeout from '@/lib/hooks/use-timeout';
import { AnnotationTools } from './annotation-tools';
import { CanvasPlane } from './canvas-plane';
import { Volume } from './volume';
import MeasurementTools from './measurement-tools';
import { getBoundingSphere, normalizeSrc, parseAnnotations, stringifyJson } from '@/lib/utils';
import { ControlToolbar } from './control-toolbar';
import { AnnotationToolbar } from './annotation-toolbar';
import { BoundsText } from './bounds-text';

function Scene({ backgroundColor, environmentMap, initialCameraConfig, measurementUnits, onLoad, src, srcCollections, rotationPreset }: ViewerProps) {
  const boundsRef = useRef<Group | null>(null);
  const boundsLineRef = useRef<Group | null>(null);
  const boundsSphereRef = useRef<Sphere | null>(null);
  const rotationControlsRef = useRef<Group | null>(null);
  const assetsLoadedRef = useRef(false);

  const cameraRefs: CameraRefs = {
    controls: useRef<CameraControls | null>(null),
    position: useRef<Vector3>(new Vector3()),
    target: useRef<Vector3>(new Vector3()),
  };

  const cameraPosition = new Vector3();
  const cameraTarget = new Vector3();
  const { get: getThreeState } = useThree();

  const {
    ambientLightIntensity,
    annotations,
    axesEnabled,
    boundsEnabled,
    cameraMode,
    collectionCameraConfig,
    gridEnabled,
    loading,
    mode,
    orthographicEnabled,
    rotationEuler,
    rotationXDegrees,
    rotationYDegrees,
    rotationZDegrees,
    rotationControlsEnabled,
    sceneJson,
    setAnnotations,
    setLoading,
    setMeasurementUnits,
    setRotationEuler,
    setRotationXDegrees,
    setRotationYDegrees,
    setRotationZDegrees,
    setCameraMode,
    setCollectionCameraConfig,
    setSelectedAnnotation,
    setSceneJson,
    setSrcCollections,
    setSrcCollectionSelected,
    setSrcs,
    srcCollectionSelected,
    srcs,
  } = useStore();

  const rotationMatrixRef = useRef<Matrix4>(
    new Matrix4().makeRotationFromEuler(rotationEuler)
  );

  // Tracks which collection was last navigated to; undefined = never navigated
  const lastNavedCollectionRef = useRef<number | null | undefined>(undefined);

  // Collection-specific config takes precedence over the prop
  const activeConfig = collectionCameraConfig !== undefined ? collectionCameraConfig : initialCameraConfig;

  const triggerCameraLoadingDoneEvent = useEventTrigger(CAMERA_LOADING_DONE);
  const triggerCameraUpdateEvent = useEventTrigger(CAMERA_UPDATE);
  const triggerJsonEmitEvent = useEventTrigger(JSON_EMIT);

  // Set initial state

  // Initial load, only do this on component mount
  useEffect(() => {
    if (measurementUnits) setMeasurementUnits(measurementUnits);
    if (initialCameraConfig?.cameraType) setCameraMode(initialCameraConfig.cameraType);
  }, []);

  // src or srcCollections changed, set Srcs and initiate loading
  useEffect(() => {
    if (srcs.length === 0) {
      let newSrc: Src | undefined = undefined;
      if (src) {
        newSrc = src;
      } else if (srcCollections && srcCollections.length) {
        newSrc = srcCollections[0].src;
        setSrcCollectionSelected(0);
        setSrcCollections(srcCollections);
        // Apply first collection's camera config, same as source-selector does on user selection
        const camConfig = srcCollections[0].initialCameraConfig ?? null;
        setCollectionCameraConfig(camConfig);
        setCameraMode(camConfig?.cameraType === 'orthographic' ? 'orthographic' : 'perspective');
      }

      if (newSrc) {
        const normalizedSrc = normalizeSrc(newSrc);
        const srcAnnotations = parseAnnotations(normalizedSrc.reduce(
          (acc: SrcAnnotation[], src) => { return acc.concat(src.annotations || []) },
          []
        ));
        setSrcs(normalizedSrc);
        setAnnotations(srcAnnotations && srcAnnotations.length ? srcAnnotations : []);
        // Camera will be recentered when loading is complete
      }
    } else {
      recenter(true);
    }
  }, [srcs]);

  // Reset on every new load, however srcs changed, so Loader/VolumeLoadWatcher wait for assets again.
  useEffect(() => {
    assetsLoadedRef.current = false;
  }, [srcs]);

  // When loaded, immediately set initial rotation
  useEffect(() => {
    if (!loading && rotationPreset) setRotationFromArray(rotationPreset, true);
  }, [loading]);

  // const requestJson = useEventTrigger(JSON_EMIT_REQUEST);

  // When loaded or camera type changed, after a delay, zoom to object(s) instantaneously
  useTimeout(
    () => {
      if (!loading) {
        // Apply interactionMode constraints from camera config (controls available by now)
        if (activeConfig?.interactionMode && cameraRefs.controls.current) {
          const im = activeConfig.interactionMode;
          if (im.includes('locked')) {
            (cameraRefs.controls.current as any).enabled = false;
          }
          if (im.includes('hemisphere-orbit')) {
            cameraRefs.controls.current.maxPolarAngle = Math.PI / 2;
          }
        }

        // Navigate to camera position if defined AND this collection hasn't been navigated yet.
        // Camera mode toggle re-fires the timeout but srcCollectionSelected is unchanged → recenter.
        if (activeConfig?.position && lastNavedCollectionRef.current !== srcCollectionSelected) {
          lastNavedCollectionRef.current = srcCollectionSelected;
          setCameraConfig();
          const pos = new Vector3(...activeConfig.position).applyMatrix4(rotationMatrixRef.current);
          const tgt = activeConfig.target
            ? new Vector3(...activeConfig.target).applyMatrix4(rotationMatrixRef.current)
            : new Vector3(0, 0, 0);
          cameraRefs.controls.current!.setLookAt(pos.x, pos.y, pos.z, tgt.x, tgt.y, tgt.z, false);
          triggerCameraLoadingDoneEvent();
        } else {
          recenter(true);
          triggerCameraLoadingDoneEvent();
        }
      }
    },
    1,
    [loading, cameraMode]
  );

  // Hooks for non-initial state changes

  // rotationXDegrees, rotationYDegrees, rotationZDegrees changed
  useEffect(() => {
    setRotationFromArray([
      rotationXDegrees * (Math.PI / 180),
      rotationYDegrees * (Math.PI / 180),
      rotationZDegrees * (Math.PI / 180)
    ])
  }, [rotationEuler, rotationXDegrees, rotationYDegrees, rotationZDegrees]);

  useEffect(() => {
    setSceneJson(stringifyJson(
      {
        annotations: annotations,
        scene: {
          ambientLightIntensity: ambientLightIntensity,
          environmentMap: environmentMap,
          rotation: [rotationEuler.x, rotationEuler.y, rotationEuler.z]
        },
      }
    ));
  }, [
    ambientLightIntensity,
    annotations,
    environmentMap,
    rotationEuler,
    rotationXDegrees,
    rotationYDegrees,
    rotationZDegrees,
    setSceneJson
  ]);

  // Event listeners

  const handleRecenterEvent = (e: any) => {
    recenter(e.detail);
  };

  useEventListener(RECENTER, handleRecenterEvent);

  const handleCameraEnabledEvent = (e: any) => {
    (cameraRefs.controls.current as any).enabled = e.detail;
  };

  useEventListener(CAMERA_CONTROLS_ENABLED, handleCameraEnabledEvent);

  const handleEmitJsonRequest = () => {
    triggerJsonEmitEvent(JSON.parse(sceneJson));
  };

  useEventListener(JSON_EMIT_REQUEST, handleEmitJsonRequest);

  // Methods

  function zoomToObject(object: Object3D, instant?: boolean, padding: number | undefined = undefined) {
    if (!padding) {
      if (!boundsSphereRef.current) boundsSphereRef.current = getBoundingSphere(object);
      padding = boundsSphereRef.current.radius * 0.2;
    }

    return cameraRefs.controls.current!.fitToBox(object, !instant, {
      cover: false,
      paddingLeft: padding,
      paddingRight: padding,
      paddingBottom: padding,
      paddingTop: padding,
    });
  }

  // Guards against an empty Box3's NaN/Infinite radius, which corrupts camera-controls' fitToBox.
  function getValidBoundingSphere(object: Object3D): Sphere | null {
    const sphere = getBoundingSphere(object);
    return isFinite(sphere.radius) && sphere.radius > 0 ? sphere : null;
  }

  function recenter(instant?: boolean) {
    if (boundsRef.current) {
      const sphere = getValidBoundingSphere(boundsRef.current);
      if (!sphere) return;

      setCameraConfig();

      if (instant && srcs.some((src) => src.type === 'volume')) {
        // initial custom view for volumes to get off the shoulder angle
        const padded = new Sphere(sphere.center, sphere.radius * 1.2);
        cameraRefs.controls.current?.fitToSphere(padded, !instant);
        cameraRefs.controls.current?.rotateTo(Math.PI / 4, Math.PI / 4, !instant);
      } else {
        zoomToObject(boundsRef.current, instant);
      }
    }
  }

  function setCameraConfig() {
    if (boundsRef.current) {
      const sphere = getValidBoundingSphere(boundsRef.current);
      if (!sphere) return;

      boundsSphereRef.current = sphere;
      const radius = sphere.radius;

      const liveCamera = getThreeState().camera;

      if (orthographicEnabled) {
        const cameraObjectDistance = cameraRefs.controls.current?.distance;
        if (cameraObjectDistance) {
          liveCamera.near = cameraObjectDistance - (radius * 100);
          liveCamera.far = cameraObjectDistance + (radius * 100);
          liveCamera.updateProjectionMatrix();
        }

        if (cameraRefs.controls.current && liveCamera instanceof ThreeOrthographicCamera) {
          const width = liveCamera.right - liveCamera.left;
          const height = liveCamera.top - liveCamera.bottom;
          const diameter = radius * 2;
          const zoom = Math.min( width / diameter, height / diameter );

          // Don't set maximum zoom for multiple objects
          cameraRefs.controls.current.maxZoom = (srcs.length === 1) ? (zoom*4) : Infinity;
          cameraRefs.controls.current.minZoom = zoom/4;
          // Apply fit zoom with padding. For the recenter path fitToBox overrides this;
          // for the configured-position path this is the only zoom-setter called.
          void cameraRefs.controls.current.zoomTo(zoom / 1.2, false);
        }
      } else {
        liveCamera.near = radius * 0.01;
        liveCamera.far = radius * 200;

        if (activeConfig?.near !== undefined) liveCamera.near = activeConfig.near;
        if (activeConfig?.far !== undefined)  liveCamera.far  = activeConfig.far;
        liveCamera.updateProjectionMatrix();

        if (cameraRefs.controls.current) {
          // Don't set minimum distance for multiple objects
          cameraRefs.controls.current.minDistance = (srcs.length === 1) ? radius : Number.EPSILON;
          cameraRefs.controls.current.maxDistance = radius * 5;
        }
      }
    }
  }

  // Set rotation euler, matrix, and degrees from array of XYZ euler angles in radians
  function setRotationFromArray(rotation: [number, number, number], setRotationDegrees?: boolean) {
    setRotationEuler(rotationEuler.fromArray(rotation));
    rotationMatrixRef.current.makeRotationFromEuler(rotationEuler);

    if (setRotationDegrees) {
      setRotationXDegrees(rotationEuler.x * (180 / Math.PI));
      setRotationYDegrees(rotationEuler.y * (180 / Math.PI));
      setRotationZDegrees(rotationEuler.z * (180 / Math.PI));
    }
  }

  // Set rotation euler, matrix, and degrees from matrix
  function setRotationFromMatrix4(matrix: Matrix4) {
    rotationMatrixRef.current.copy(matrix);
    setRotationEuler(rotationEuler.setFromRotationMatrix(matrix, 'XYZ'));
    setRotationXDegrees(rotationEuler.x * (180 / Math.PI));
    setRotationYDegrees(rotationEuler.y * (180 / Math.PI));
    setRotationZDegrees(rotationEuler.z * (180 / Math.PI));
  }

  function getGridProperties(): [size?: number | undefined, divisions?: number | undefined] {
    if (boundsRef.current) {
      if (!boundsSphereRef.current) boundsSphereRef.current = getBoundingSphere(boundsRef.current);

      const breakPoints = [0.001, 0.01, 0.1, 1.0, 10.0, 100.0];
      let cellWidth = 10.0; // maximum possible value, reduce to scale with object

      for (const breakPoint of breakPoints) {
        if (boundsSphereRef.current.radius! < breakPoint) {
          cellWidth = breakPoint/10.0;
          break;
        }
      }

      return [cellWidth * 100.0, 100]
    } else {
      return [100, 100];
    }
  }

  function onCameraChange(e: any) {
    if (e.type !== 'update') {
      return;
    }

    // get current camera position
    cameraRefs.controls.current!.getPosition(cameraPosition);
    cameraRefs.position.current = cameraPosition;

    // get current camera target
    cameraRefs.controls.current!.getTarget(cameraTarget);
    cameraRefs.target.current = cameraTarget;

    triggerCameraUpdateEvent({ cameraPosition, cameraTarget, rotationMatrix: rotationMatrixRef.current });
  }

  const Tools: { [key in Mode]: React.ReactElement } = {
    annotation: <AnnotationTools cameraRefs={cameraRefs} boundsSphereRef={boundsSphereRef} rotationMatrixRef={rotationMatrixRef} />,
    measurement: <MeasurementTools rotationMatrixRef={rotationMatrixRef} />,
    scene: <AnnotationTools cameraRefs={cameraRefs} boundsSphereRef={boundsSphereRef} rotationMatrixRef={rotationMatrixRef} viewOnly={true} />,
  };

  return (
    <>
      {backgroundColor && <color attach="background" args={[backgroundColor]} />}
      {orthographicEnabled
        ? <OrthographicCamera
            makeDefault
            near={activeConfig?.near}
            far={activeConfig?.far}
            position={activeConfig?.position ?? [0, 0, 2]}
          />
        : <PerspectiveCamera
            makeDefault
            fov={activeConfig?.fieldOfView ?? 30}
            near={activeConfig?.near}
            far={activeConfig?.far}
            position={activeConfig?.position ?? [0, 0, 2]}
          />
      }
      <CameraControls ref={cameraRefs.controls} onChange={onCameraChange} makeDefault />
      <ambientLight intensity={ambientLightIntensity} />

      <Suspense fallback={<Loader onLoad={onLoad} srcs={srcs} setLoading={setLoading} assetsLoadedRef={assetsLoadedRef} />}>
        <PivotControls
          ref={rotationControlsRef}
          autoTransform={false}
          depthTest={false}
          disableAxes={true}
          disableScaling={true}
          disableSliders={true}
          enabled={rotationControlsEnabled && mode == 'scene'}
          fixed={true}
          matrix={rotationMatrixRef.current}
          onDrag={(local) => setRotationFromMatrix4(local)}
          scale={300}
        >
          <Bounds
            boundsRef={boundsRef}
            boundsLineRef={boundsLineRef}
            rotationMatrixRef={rotationMatrixRef}
            mode={mode}
            lineVisible={boundsEnabled && mode == 'scene'}
            setSelectedAnnotation={setSelectedAnnotation}
            zoomToObject={zoomToObject}
          >
            {srcs.map((src, index) => {
              if (src.type === 'canvas' && src.corners) {
                return <CanvasPlane key={index} url={src.url} corners={src.corners} />;
              }
              if (src.type === 'volume') {
                return <Volume key={index} {...src} />;
              }
              return <GLTF key={index} {...src} />;
            })}
          </Bounds>
        </PivotControls>
      </Suspense>
      <VolumeLoadWatcher onLoad={onLoad} srcs={srcs} setLoading={setLoading} loading={loading} assetsLoadedRef={assetsLoadedRef} />
      <Environment preset={environmentMap} />
      {Tools[mode]}
      { (gridEnabled && mode == 'scene') && <gridHelper args={getGridProperties()} />}
      { (axesEnabled && mode == 'scene') &&
        <GizmoHelper alignment="bottom-right" margin={[100, 100]}>
          <GizmoViewport labelColor="white" axisHeadScale={1} />
        </GizmoHelper>
      }
    </>
  );
}

// Module scope, not nested in Scene() — avoids remounting the whole subtree on unrelated re-renders.

function Bounds({
  boundsRef,
  boundsLineRef,
  rotationMatrixRef,
  mode,
  lineVisible,
  children,
  setSelectedAnnotation,
  zoomToObject,
}: {
  boundsRef: React.MutableRefObject<Group | null>;
  boundsLineRef: React.MutableRefObject<Group | null>;
  rotationMatrixRef: React.MutableRefObject<Matrix4>;
  mode: Mode;
  lineVisible?: boolean;
  children: React.ReactNode;
  setSelectedAnnotation: (selectedAnnotation: number | null) => void;
  zoomToObject: (object: Object3D, instant?: boolean, padding?: number) => void;
}) {
  const boundsScene = useThree((state) => state.scene);
  const boxHelperRef = useRef<BoxHelper | null>(null);

  useEffect(() => {
    if (!lineVisible || !boundsLineRef.current) return;
    const helper = new BoxHelper(boundsLineRef.current, 'white');
    helper.traverse((child) => {
      child.raycast = () => null;
    });
    boundsScene.add(helper);
    boxHelperRef.current = helper;
    return () => {
      boxHelperRef.current = null;
      boundsScene.remove(helper);
      helper.dispose();
    };
  }, [lineVisible, boundsScene, boundsLineRef]);

  useFrame(() => {
    boxHelperRef.current?.update();
  });

  // zoom to object on double click in scene mode
  const handleDoubleClickEvent = (e: any) => {
    if (mode === 'scene') {
      e.stopPropagation();
      if (e.delta <= 2) {
        zoomToObject(e.object);
      }
    }
  };

  return (
    <group
      ref={boundsRef}
      onDoubleClick={handleDoubleClickEvent}
      onPointerMissed={(e: MouseEvent) => {
        const tagName = (e.target as HTMLElement).tagName;
        if (tagName === 'SPAN' || tagName === 'DIV') {
          // clicking on an overlaid annotation label or description
          return;
        } else {
          setSelectedAnnotation(null);
        }
      }}>
      {lineVisible ? <group ref={boundsLineRef}>{children}</group> : children}
      { lineVisible && <BoundsText boundsRef={boundsRef} rotationMatrixRef={rotationMatrixRef} /> }
    </group>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const { gl } = useThree();

  return (
    <Html
      wrapperClass="loading"
      calculatePosition={() => {
        return [gl.domElement.clientWidth / 2, gl.domElement.clientHeight / 2];
      }}>
      <div className="flex justify-center">
        <div className="h-1 w-24 bg-black rounded-full overflow-hidden transform translate-x-[-50%]">
          <div
            className="h-full bg-white"
            style={{
              width: `${Math.ceil(percent)}%`,
            }}
          />
        </div>
      </div>
    </Html>
  );
}

// Window CustomEvent, not the store, so updates only re-render the caller. Resets synchronously
// during render (a useEffect would leave the stale value for one commit) when srcs changes.
function useVolumeLoadingProgress(srcs: SrcObj[]): number {
  const hasVolumeSrc = srcs.some((s) => s.type === 'volume');
  const resetValue = hasVolumeSrc ? 0 : 1;
  const [volumeProgress, setVolumeProgress] = useState(resetValue);
  const prevSrcsRef = useRef(srcs);

  if (prevSrcsRef.current !== srcs) {
    prevSrcsRef.current = srcs;
    if (volumeProgress !== resetValue) setVolumeProgress(resetValue);
  }

  useEventListener(VOLUME_LOADING_PROGRESS, (e: any) => setVolumeProgress(e.detail));
  return volumeProgress;
}

type LoadingProps = {
  onLoad?: (srcs: SrcObj[]) => void;
  srcs: SrcObj[];
  setLoading: (loading: boolean) => void;
  assetsLoadedRef: React.MutableRefObject<boolean>;
};

function Loader({ onLoad, srcs, setLoading, assetsLoadedRef }: LoadingProps) {
  const { progress } = useProgress();
  const volumeLoadingProgress = useVolumeLoadingProgress(srcs);
  if (progress === 100) {
    assetsLoadedRef.current = true;
    if (volumeLoadingProgress === 1) {
      setTimeout(() => {
        if (onLoad) {
          onLoad(srcs);
          setLoading(false);
        }
      }, 1);
    }
  }

  return <ProgressBar percent={progress} />;
}

// Handoff for when Loader unmounts (GLTF/texture done) before a slower volume decode finishes —
// assetsLoadedRef records that. Doesn't call useProgress() itself: triggers a cross-component
// update-during-render warning from a permanently-mounted component.
function VolumeLoadWatcher({ onLoad, srcs, setLoading, loading, assetsLoadedRef }: LoadingProps & { loading: boolean }) {
  const volumeLoadingProgress = useVolumeLoadingProgress(srcs);
  const hasVolumeSrc = srcs.some((s) => s.type === 'volume');
  // Nothing else to wait for if every src is a volume — Loader never mounts in that case, so
  // assetsLoadedRef never gets set.
  const noOtherAssetsToLoad = srcs.every((s) => s.type === 'volume');

  useEffect(() => {
    if (!loading || !hasVolumeSrc) return;
    if ((assetsLoadedRef.current || noOtherAssetsToLoad) && volumeLoadingProgress === 1) {
      setTimeout(() => {
        if (onLoad) {
          onLoad(srcs);
          setLoading(false);
        }
      }, 1);
    }
  }, [volumeLoadingProgress, hasVolumeSrc, noOtherAssetsToLoad, loading, srcs, onLoad, setLoading, assetsLoadedRef]);

  if (!hasVolumeSrc || volumeLoadingProgress === 1) return null;

  return <ProgressBar percent={volumeLoadingProgress * 100} />;
}

const Viewer = (props: ViewerProps, ref: ((instance: unknown) => void) | RefObject<unknown> | null | undefined) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { volumeRenderMode } = useStore();

  const triggerDoubleClickEvent = useEventTrigger(DBL_CLICK);
  const triggerRecenterEvent = useEventTrigger(RECENTER);

  useImperativeHandle(ref, () => ({
    recenter: (instant?: boolean) => {
      triggerRecenterEvent(instant);
    },
  }));

  useEventListener(DRAGGING_MEASUREMENT, () => {
    // add dragging class to body
    document.body.classList.add('dragging');
  });

  useEventListener(DROPPED_MEASUREMENT, () => {
    // remove dragging class from body
    document.body.classList.remove('dragging');
  });

  useEventListener(DRAGGING_VOLUME_HANDLE, () => {
    document.body.classList.add('dragging');
  });

  useEventListener(DROPPED_VOLUME_HANDLE, () => {
    document.body.classList.remove('dragging');
  });

  return (
    <div className="w-full h-full relative">
      <Canvas
        ref={canvasRef}
        camera={{ fov: 30 }}
        frameloop={volumeRenderMode === 'isosurface' || volumeRenderMode === 'mip' ? 'demand' : 'always'}
        onDoubleClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          triggerDoubleClickEvent(e);
        }}>
        <Scene {...props} />
      </Canvas>
      <AnnotationToolbar />
      <ControlToolbar />
    </div>
  );
};

export default forwardRef(Viewer);
