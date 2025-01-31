import '@/viewer.css';
import '../index.css';
import React, { RefObject, Suspense, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
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
  useHelper,
  useProgress,
} from '@react-three/drei';
import { BoxHelper, Group, Object3D, Vector3, Matrix4, Sphere } from 'three';
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
  CAMERA_CONTROLS_ENABLED,
} from '@/types';
import { useEventListener, useEventTrigger } from '@/lib/hooks/use-event';
import useTimeout from '@/lib/hooks/use-timeout';
import { AnnotationTools } from './annotation-tools';
import MeasurementTools from './measurement-tools';
import { getBoundingSphere, normalizeSrc } from '@/lib/utils';

function Scene({ envPreset, onLoad, src, rotationPreset }: ViewerProps) {
  const boundsRef = useRef<Group | null>(null);
  const boundsLineRef = useRef<Group | null>(null);
  const boundsSphereRef = useRef<Sphere | null>(null);
  const rotationControlsRef = useRef<Group | null>(null);

  const cameraRefs: CameraRefs = {
    controls: useRef<CameraControls | null>(null),
    position: useRef<Vector3>(new Vector3()),
    target: useRef<Vector3>(new Vector3()),
  };

  const cameraPosition = new Vector3();
  const cameraTarget = new Vector3();
  const { camera, gl } = useThree();

  const {
    ambientLightIntensity,
    axesEnabled,
    boundsEnabled,
    cameraMode,
    gridEnabled,
    loading,
    mode,
    orthographicEnabled,
    rotationEuler,
    rotationXDegrees,
    rotationYDegrees,
    rotationZDegrees,
    sceneControlsEnabled,
    setAnnotations,
    setLoading,
    setRotationEuler,
    setRotationXDegrees,
    setRotationYDegrees,
    setRotationZDegrees,
    setSelectedAnnotation,
    setSrcs,
    srcs,
  } = useStore();

  const rotationMatrixRef = useRef<Matrix4>(
    new Matrix4().makeRotationFromEuler(rotationEuler)
  );

  const triggerCameraUpdateEvent = useEventTrigger(CAMERA_UPDATE);

  // src changed
  useEffect(() => {
    const srcs: SrcObj[] = normalizeSrc(src);
    setSrcs(srcs);
    setAnnotations([]);
  }, [src]);

  // rotationXDegrees, rotationYDegrees, rotationZDegrees changed
  useEffect(() => {  
    setRotationFromArray([
      rotationXDegrees * (Math.PI / 180), 
      rotationYDegrees * (Math.PI / 180), 
      rotationZDegrees * (Math.PI / 180)
    ])
  }, [rotationEuler, rotationXDegrees, rotationYDegrees, rotationZDegrees]);

  // When loaded, set initial rotation
  // todo: this looks good, but wrap up all the rotation setting in functions
  useEffect(() => {
    if (!loading && rotationPreset) setRotationFromArray(rotationPreset, true); 
  }, [loading]);

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

  const handleRecenterEvent = (e: any) => {
    recenter(e.detail);
  };

  useEventListener(RECENTER, handleRecenterEvent);

  const handleCameraEnabledEvent = (e: any) => {
    (cameraRefs.controls.current as any).enabled = e.detail;
  };

  useEventListener(CAMERA_CONTROLS_ENABLED, handleCameraEnabledEvent);

  function zoomToObject(object: Object3D, instant?: boolean, padding: number | undefined = undefined) {
    if (!padding) {
      if (!boundsSphereRef.current) boundsSphereRef.current = getBoundingSphere(object);
      padding = boundsSphereRef.current.radius * 0.1;
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
      setCameraConfig();
      zoomToObject(boundsRef.current, instant);
    }
  }

  function setCameraConfig() {
    if (boundsRef.current) {
      boundsSphereRef.current = getBoundingSphere(boundsRef.current);
      const radius = boundsSphereRef.current.radius;

      if (orthographicEnabled) {
        const cameraObjectDistance = cameraRefs.controls.current?.distance;
        if (cameraObjectDistance) {
          camera.near = cameraObjectDistance - (radius * 100);
          camera.far = cameraObjectDistance + (radius * 100);
          camera.updateProjectionMatrix();
        }

        if (cameraRefs.controls.current) {
          if ('isOrthographicCamera' in camera && camera.isOrthographicCamera) {
            const width = camera.right - camera.left;
            const height = camera.top - camera.bottom;
            const diameter = radius * 2;
            const zoom = Math.min( width / diameter, height / diameter );

            // Don't set maximum zoom for multiple objects
            cameraRefs.controls.current.maxZoom = (srcs.length === 1) ? (zoom*4) : Infinity;
            cameraRefs.controls.current.minZoom = zoom/4;
          }
        }
      } else {
        camera.near = radius * 0.01;
        camera.far = radius * 200;
        camera.updateProjectionMatrix();

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

    triggerCameraUpdateEvent({ cameraPosition, cameraTarget, rotationMatrix: rotationMatrixRef.current });
  }

  const Tools: { [key in Mode]: React.ReactElement } = {
    annotation: <AnnotationTools cameraRefs={cameraRefs} rotationMatrixRef={rotationMatrixRef} />,
    measurement: <MeasurementTools rotationMatrixRef={rotationMatrixRef} />,
    scene: <></>,
  };

  return (
    <>
      {orthographicEnabled ? <OrthographicCamera makeDefault position={[0, 0, 2]} /> : <PerspectiveCamera makeDefault fov={30} position={[0, 0, 2]} />}
      <CameraControls ref={cameraRefs.controls} onChange={onCameraChange} makeDefault />
      <ambientLight intensity={ambientLightIntensity} />

      <Suspense fallback={<Loader />}>
        <PivotControls
          ref={rotationControlsRef}
          autoTransform={false}
          depthTest={false}
          disableAxes={true} 
          disableScaling={true} 
          disableSliders={true} 
          enabled={sceneControlsEnabled && mode == 'scene'}
          fixed={true}
          matrix={rotationMatrixRef.current}
          onDrag={(local) => setRotationFromMatrix4(local)}
          scale={300} 
        >
          <Bounds lineVisible={boundsEnabled && mode == 'scene'}>
            {srcs.map((src, index) => { return (
              <GLTF key={index} {...src} />
            );})}
          </Bounds>
        </PivotControls>
      </Suspense>
      <Environment preset={envPreset} />
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

const Viewer = (props: ViewerProps, ref: ((instance: unknown) => void) | RefObject<unknown> | null | undefined) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
