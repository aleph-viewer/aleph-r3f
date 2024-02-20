import '@/viewer.css';
import '../index.css';
import React, { RefObject, Suspense, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { GLTF } from '@/components/gltf';
import {
  CameraControls,
  Environment,
  Html,
  OrthographicCamera,
  PerspectiveCamera,
  useHelper,
  useProgress,
} from '@react-three/drei';
import { BoxHelper, Group, Object3D, Vector3 } from 'three';
import useStore from '@/Store';
import { ViewerProps as ViewerProps, SrcObj, CAMERA_UPDATE, DBL_CLICK, HOME_CLICK, Mode, CameraRefs } from '@/types';
import useDoubleClick from '@/lib/hooks/use-double-click';
import { useEventListener, useEventTrigger } from '@/lib/hooks/use-event';
import useTimeout from '@/lib/hooks/use-timeout';
import { AnnotationTools } from './annotation-tools';
import MeasurementTools from './measurement-tools';

function Scene({ onLoad, src }: ViewerProps) {
  const boundsRef = useRef<Group | null>(null);

  const cameraRefs: CameraRefs = {
    cameraControls: useRef<CameraControls | null>(null),
    cameraPosition: useRef<Vector3>(new Vector3()),
    cameraTarget: useRef<Vector3>(new Vector3()),
  };

  const environment = 'apartment';
  const minDistance = 0;

  const { camera } = useThree();

  const {
    ambientLightIntensity,
    axesEnabled,
    boundsEnabled,
    gridEnabled,
    loading,
    mode,
    orthographicEnabled,
    setLoading,
    setSrcs,
    srcs,
    upVector,
  } = useStore();

  // set the camera up vector
  camera.up.copy(new Vector3(upVector[0], upVector[1], upVector[2]));
  cameraRefs.cameraControls.current?.updateCameraUp();

  // src changed
  useEffect(() => {
    const srcs: SrcObj[] = [];

    // is the src a string or an array of ModelSrc objects?
    // if it's a string, create a ModelSrc object from it
    if (typeof src === 'string') {
      srcs.push({
        url: src as string,
      });
    } else if (Array.isArray(src)) {
      // if it's an array, then it's already a ModelSrc object
      srcs.push(...(src as SrcObj[]));
    } else {
      // if it's not a string or an array, then it's a single ModelSrc object
      srcs.push(src as SrcObj);
    }

    setSrcs(srcs);
  }, [src]);

  // when loaded or camera type changed, zoom to object(s) instantaneously
  useTimeout(
    () => {
      if (!loading) {
        home(true);
      }
    },
    1,
    [loading, orthographicEnabled]
  );

  const triggerCameraUpdateEvent = useEventTrigger(CAMERA_UPDATE);

  const handleHomeClickEvent = () => {
    home();
  };

  useEventListener(HOME_CLICK, handleHomeClickEvent);

  function zoomToObject(object: Object3D, instant?: boolean, padding: number = 0.1) {
    cameraRefs.cameraControls.current!.fitToBox(object, !instant, {
      cover: false,
      paddingLeft: padding,
      paddingRight: padding,
      paddingBottom: padding,
      paddingTop: padding,
    });
  }

  function home(instant?: boolean, padding?: number) {
    if (boundsRef.current) {
      zoomToObject(boundsRef.current, instant, padding);
    }
  }

  function Bounds({ lineVisible, children }: { lineVisible?: boolean; children: React.ReactNode }) {
    const boundsLineRef = useRef<Group | null>(null);

    // @ts-ignore
    useHelper(boundsLineRef, BoxHelper, 'white');

    const handleDoubleClickEvent = (e: any) => {
      if (mode === 'scene') {
        e.stopPropagation();
        if (e.delta <= 2) {
          zoomToObject(e.object);
        }
      }
    };

    const handleOnPointerMissed = useDoubleClick(() => {
      home();
    });

    return (
      <group ref={boundsRef} onDoubleClick={handleDoubleClickEvent} onPointerMissed={handleOnPointerMissed}>
        {lineVisible ? <group ref={boundsLineRef}>{children}</group> : children}
      </group>
    );
  }

  function Loader() {
    const { progress } = useProgress();
    if (progress === 100) {
      setTimeout(() => {
        if (onLoad) {
          onLoad();
          setLoading(false);
        }
      }, 1);
    }

    return <Html wrapperClass="loading">{Math.ceil(progress)} %</Html>;
  }

  function onCameraChange(e: any) {
    if (e.type !== 'update') {
      return;
    }

    // get current camera position
    const cameraPosition: Vector3 = new Vector3();
    cameraRefs.cameraControls.current!.getPosition(cameraPosition);
    cameraRefs.cameraPosition.current = cameraPosition;

    // get current camera target
    const cameraTarget: Vector3 = new Vector3();
    cameraRefs.cameraControls.current!.getTarget(cameraTarget);
    cameraRefs.cameraTarget.current = cameraTarget;

    triggerCameraUpdateEvent({ cameraPosition, cameraTarget });
  }

  const Tools: { [key in Mode]: React.ReactElement } = {
    annotation: <AnnotationTools cameraRefs={cameraRefs} />,
    measurement: <MeasurementTools cameraRefs={cameraRefs} />,
    scene: <></>,
  };

  return (
    <>
      {orthographicEnabled ? (
        <>
          {/* @ts-ignore */}
          <OrthographicCamera makeDefault position={[0, 0, 2]} near={0} zoom={200} />
        </>
      ) : (
        <>
          {/* @ts-ignore */}
          <PerspectiveCamera position={[0, 0, 2]} fov={50} near={0.01} />
        </>
      )}
      <CameraControls ref={cameraRefs.cameraControls} minDistance={minDistance} onChange={onCameraChange} />
      <ambientLight intensity={ambientLightIntensity} />
      <Bounds lineVisible={boundsEnabled}>
        <Suspense fallback={<Loader />}>
          {srcs.map((src, index) => {
            return <GLTF key={index} {...src} />;
          })}
        </Suspense>
      </Bounds>
      <Environment preset={environment} />
      {Tools[mode]}
      {gridEnabled && <gridHelper args={[100, 100]} />}
      {axesEnabled && <axesHelper args={[5]} />}
    </>
  );
}

const Viewer = (props: ViewerProps, ref: ((instance: unknown) => void) | RefObject<unknown> | null | undefined) => {
  const triggerDoubleClickEvent = useEventTrigger(DBL_CLICK);
  const triggerHomeClickEvent = useEventTrigger(HOME_CLICK);

  useImperativeHandle(ref, () => ({
    home: () => {
      triggerHomeClickEvent();
    },
  }));

  return (
    <Canvas
      onDoubleClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        triggerDoubleClickEvent(e);
      }}>
      <Scene {...props} />
    </Canvas>
  );
};

export default forwardRef(Viewer);
