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
import {
  ViewerProps as ViewerProps,
  SrcObj,
  CAMERA_UPDATE,
  DBL_CLICK,
  Mode,
  CameraRefs,
  DRAGGING_MEASUREMENT,
  DROPPED_MEASUREMENT,
  RECENTER,
  RECENTER_INSTANT,
  CAMERA_CONTROLS_ENABLED,
} from '@/types';
import useDoubleClick from '@/lib/hooks/use-double-click';
import { useEventListener, useEventTrigger } from '@/lib/hooks/use-event';
import useTimeout from '@/lib/hooks/use-timeout';
import { AnnotationTools } from './annotation-tools';
import MeasurementTools from './measurement-tools';
import { getBoundingSphereRadius, normalizeSrc } from '@/lib/utils';

function Scene({ envPreset, onLoad, src }: ViewerProps) {
  const boundsRef = useRef<Group | null>(null);
  const boundsLineRef = useRef<Group | null>(null);

  const cameraRefs: CameraRefs = {
    controls: useRef<CameraControls | null>(null),
    position: useRef<Vector3>(new Vector3()),
    target: useRef<Vector3>(new Vector3()),
  };

  const cameraPosition = new Vector3();
  const cameraTarget = new Vector3();
  const { camera, gl } = useThree();

  let boundingSphereRadius: number | null = null;

  const {
    ambientLightIntensity,
    axesEnabled,
    boundsEnabled,
    cameraMode,
    gridEnabled,
    loading,
    mode,
    orientation,
    orthographicEnabled,
    setAnnotations,
    setLoading,
    setSelectedAnnotation,
    setSrcs,
    srcs,
    upVector,
  } = useStore();

  const triggerCameraUpdateEvent = useEventTrigger(CAMERA_UPDATE);

  // src changed
  useEffect(() => {
    const srcs: SrcObj[] = normalizeSrc(src);
    setSrcs(srcs);
    setAnnotations([]);
  }, [src]);

  // orientation changed
  useEffect(() => {
    recenter();
  }, [orientation]);

  // upVector changed
  useEffect(() => {
    const cameraUpChanged = setCameraUp();
    if (cameraUpChanged) recenter();
  }, [upVector]);

  // when loaded or camera type changed, zoom to object(s) instantaneously
  useTimeout(
    () => {
      if (!loading) {
        recenter(true);
      }
    },
    1,
    [loading, cameraMode]
  );

  const handleRecenterEvent = () => {
    recenter();
  };

  useEventListener(RECENTER, handleRecenterEvent);

  const handleRecenterInstantEvent = () => {
    recenter(true);
  };

  useEventListener(RECENTER_INSTANT, handleRecenterInstantEvent);

  const handleCameraEnabledEvent = (e: any) => {
    (cameraRefs.controls.current as any).enabled = e.detail;
  };

  useEventListener(CAMERA_CONTROLS_ENABLED, handleCameraEnabledEvent);

  function zoomToObject(object: Object3D, instant?: boolean, padding: number | undefined = undefined) {
    if (!padding) {
      const radius = boundingSphereRadius || getBoundingSphereRadius(object);
      padding = radius * 0.1;
    }

    cameraRefs.controls.current!.fitToBox(object, !instant, {
      cover: false,
      paddingLeft: padding,
      paddingRight: padding,
      paddingBottom: padding,
      paddingTop: padding,
    });
  }

  function recenter(instant?: boolean) {
    if (boundsRef.current) {
      setCameraUp();
      setCameraConfig();
      zoomToObject(boundsRef.current, instant);
    }
  }

  function setCameraConfig() {
    if (boundsRef.current) {
      if (!boundingSphereRadius) boundingSphereRadius = getBoundingSphereRadius(boundsRef.current);

      if (orthographicEnabled) {
        const cameraObjectDistance = cameraRefs.controls.current?.distance;
        if (cameraObjectDistance) {
          camera.near = cameraObjectDistance - (boundingSphereRadius * 100);
          camera.far = cameraObjectDistance + (boundingSphereRadius * 100);
          camera.updateProjectionMatrix();
        }

        if (cameraRefs.controls.current) {
          if ('isOrthographicCamera' in camera && camera.isOrthographicCamera) {
            const width = camera.right - camera.left;
            const height = camera.top - camera.bottom;
            const diameter = boundingSphereRadius * 2;

            const zoom = Math.min( width / diameter, height / diameter );
            cameraRefs.controls.current.maxZoom = zoom * 4;
            cameraRefs.controls.current.minZoom = zoom/4;
          }
        }
      } else {
        camera.near = boundingSphereRadius * 0.01;
        camera.far = boundingSphereRadius * 200;
        camera.updateProjectionMatrix();

        if (cameraRefs.controls.current) {
          cameraRefs.controls.current.minDistance = boundingSphereRadius;
          cameraRefs.controls.current.maxDistance = boundingSphereRadius * 5;
        }
      }
    }
  }

  function setCameraUp() {
    const upVectorToNumeric = {
      'y-positive': [0, 1, 0],
      'y-negative': [0, -1, 0],
      'z-positive': [0, 0, 1],
      'z-negative': [0, 0, -1]
    };
    const upVectorNumeric = upVectorToNumeric[upVector];

    const newCameraUp = new Vector3(upVectorNumeric[0], upVectorNumeric[1], upVectorNumeric[2]);
    const cameraUpChange = !camera.up.equals(newCameraUp);
    if (cameraUpChange) {
      camera.up.copy(newCameraUp);
      cameraRefs.controls.current?.updateCameraUp();
    }

    return cameraUpChange;
  }

  function getAxesProperties(): [size?: number | undefined] {
    if (boundsRef.current) {
      if (!boundingSphereRadius) boundingSphereRadius = getBoundingSphereRadius(boundsRef.current);
      return [boundingSphereRadius * 2];
    } else {
      return [5];
    }
  }

  function getGridProperties(): [size?: number | undefined, divisions?: number | undefined] {
    if (boundsRef.current) {
      if (!boundingSphereRadius) boundingSphereRadius = getBoundingSphereRadius(boundsRef.current);

      const breakPoints = [0.001, 0.01, 0.1, 1.0, 10.0, 100.0];
      let cellWidth = 10.0; // maximum possible value, reduce to scale with object

      for (const breakPoint of breakPoints) {
        if (boundingSphereRadius! < breakPoint) {
          cellWidth = breakPoint/10.0;
          break;
        } 
      }
      
      return [cellWidth * 100.0, 100]
    } else {
      return [100, 100];
    }
  }

  function Bounds({ lineVisible, children }: { lineVisible?: boolean; children: React.ReactNode }) {
    // @ts-ignore
    useHelper(boundsLineRef, BoxHelper, 'white');

    // zoom to object on double click in scene mode
    const handleDoubleClickEvent = (e: any) => {
      if (mode === 'scene') {
        e.stopPropagation();
        if (e.delta <= 2) {
          zoomToObject(e.object);
        }
      }
    };

    // zoom to fit bounds on double click on background
    const handleOnPointerMissed = useDoubleClick(() => {
      if (mode === 'scene' || mode === 'annotation') {
        recenter();
      }
    });

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
            handleOnPointerMissed(e);
            setSelectedAnnotation(null);
          }
        }}>
        {lineVisible ? <group ref={boundsLineRef}>{children}</group> : children}
      </group>
    );
  }

  function Loader() {
    const { progress } = useProgress();
    if (progress === 100) {
      setTimeout(() => {
        if (onLoad) {
          onLoad(srcs);
          setLoading(false);
        }
      }, 1);
    }

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
                width: `${Math.ceil(progress)}%`,
              }}
            />
          </div>
        </div>
      </Html>
    );
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

    triggerCameraUpdateEvent({ cameraPosition, cameraTarget });
  }

  const Tools: { [key in Mode]: React.ReactElement } = {
    annotation: <AnnotationTools cameraRefs={cameraRefs} />,
    measurement: <MeasurementTools />,
    scene: <></>,
  };

  return (
    <>
      {orthographicEnabled ? <OrthographicCamera makeDefault position={[0, 0, 2]} /> : <PerspectiveCamera makeDefault fov={30} position={[0, 0, 2]} />}
      <CameraControls ref={cameraRefs.controls} onChange={onCameraChange} />
      <ambientLight intensity={ambientLightIntensity} />
      <Bounds lineVisible={boundsEnabled && mode == 'scene'}>
        <Suspense fallback={<Loader />}>
          {srcs.map((src, index) => {
            return <GLTF key={index} {...src} orientation={orientation} />;
          })}
        </Suspense>
      </Bounds>
      <Environment preset={envPreset} />
      {Tools[mode]}
      { (gridEnabled && mode == 'scene') && <gridHelper args={getGridProperties()} />}
      { (axesEnabled && mode == 'scene') && <axesHelper args={getAxesProperties()} />}
    </>
  );
}

const Viewer = (props: ViewerProps, ref: ((instance: unknown) => void) | RefObject<unknown> | null | undefined) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const triggerDoubleClickEvent = useEventTrigger(DBL_CLICK);
  const triggerRecenterEvent = useEventTrigger(RECENTER);
  const triggerRecenterInstantEvent = useEventTrigger(RECENTER_INSTANT);

  useImperativeHandle(ref, () => ({
    recenter: () => {
      triggerRecenterEvent();
    },
    recenterInstant: () => {
      triggerRecenterInstantEvent();
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

  return (
    <>
      <Canvas
        ref={canvasRef}
        camera={{ fov: 30 }}
        onDoubleClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          triggerDoubleClickEvent(e);
        }}>
        <Scene {...props} />
      </Canvas>
    </>
  );
};

export default forwardRef(Viewer);
