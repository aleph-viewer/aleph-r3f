import '@/viewer.css';
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
import { BoxHelper, Group, Intersection, Object3D, Vector3 } from 'three';
import useStore from '@/Store';
import { ViewerProps as ViewerProps, Annotation, SrcObj } from '@/types';
import useDoubleClick from '@/lib/hooks/use-double-click';
import { triggerEvent } from '@/lib/utils';
import { ANNO_CLICK, CAMERA_UPDATE, DBL_CLICK, HOME_CLICK } from '@/types/Events';

function Scene({ environment = 'apartment', minDistance = 0, onLoad, src, upVector = [0, 1, 0] }: ViewerProps) {
  const boundsRef = useRef<Group | null>(null);
  const cameraControlsRef = useRef<CameraControls | null>(null);
  const cameraPositionRef = useRef<Vector3>(new Vector3());
  const cameraTargetRef = useRef<Vector3>(new Vector3());

  const { scene, camera, pointer, raycaster } = useThree();

  // if a dot product is less than this, then the normal is facing away from the camera
  const DOT_PRODUCT_THRESHOLD = Math.PI * -0.1;

  const {
    ambientLightIntensity,
    annotateOnDoubleClickEnabled,
    annotations,
    arrowHelpersEnabled,
    axesEnabled,
    boundsEnabled,
    gridEnabled,
    loading,
    orthographicEnabled,
    setAnnotations,
    setLoading,
    setSrcs,
    srcs,
  } = useStore();

  // set the camera up vector
  camera.up.copy(new Vector3(upVector[0], upVector[1], upVector[2]));
  cameraControlsRef.current?.updateCameraUp();

  // const fov = (camera as any).getFocalLength();
  // console.log('fov', fov);

  // if (orthographicEnabled) {
  //   (camera as THREE.PerspectiveCamera).setFocalLength(180);
  // } else {
  //   (camera as THREE.PerspectiveCamera).setFocalLength(50);
  // }

  // register/unregister event handlers
  useEffect(() => {
    // @ts-ignore
    window.addEventListener(HOME_CLICK, handleHomeClickEvent);

    return () => {
      // @ts-ignore
      window.removeEventListener(HOME_CLICK, handleHomeClickEvent);
    };
  }, []);

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
  useEffect(() => {
    setTimeout(() => {
      if (!loading) {
        home(true);
      }
    }, 1);
  }, [loading, orthographicEnabled]);

  const handleHomeClickEvent = () => {
    home();
  };

  function zoomToObject(object: Object3D, instant?: boolean, padding: number = 0.1) {
    cameraControlsRef.current!.fitToBox(object, !instant, {
      cover: false,
      paddingLeft: padding,
      paddingRight: padding,
      paddingBottom: padding,
      paddingTop: padding,
    });
  }

  function zoomToAnnotation(annotation: Annotation) {
    cameraControlsRef.current!.setPosition(
      annotation.cameraPosition.x,
      annotation.cameraPosition.y,
      annotation.cameraPosition.z,
      true
    );
    cameraControlsRef.current!.setTarget(
      annotation.cameraTarget.x,
      annotation.cameraTarget.y,
      annotation.cameraTarget.z,
      true
    );
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
      if (!annotateOnDoubleClickEnabled) {
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
    const { active, progress, errors, item, loaded, total } = useProgress();
    if (progress === 100) {
      setTimeout(() => {
        // home(true);
        if (onLoad) {
          onLoad();
          setLoading(false);
        }
      }, 1);
    }

    return <Html wrapperClass="loading">{Math.ceil(progress)} %</Html>;
  }

  function Annotations() {
    const lastAnnoLength = useRef<number>(0);

    let annotationsFacingCameraCheckMS: number = 100;

    // register/unregister double click event handlers
    useEffect(() => {
      window.addEventListener(DBL_CLICK, handleDoubleClickEvent);
      window.addEventListener(ANNO_CLICK, handleAnnotationClick);

      return () => {
        window.removeEventListener(DBL_CLICK, handleDoubleClickEvent);
        window.removeEventListener(ANNO_CLICK, handleAnnotationClick);
      };
    }, []);

    // create annotation on double click
    const handleDoubleClickEvent = () => {
      if (!annotateOnDoubleClickEnabled) {
        return;
      }

      raycaster.setFromCamera(pointer, camera);

      const intersects: Intersection<Object3D<Event>>[] = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        setAnnotations([
          ...annotations,
          {
            position: intersects[0].point,
            normal: intersects[0].face?.normal!,
            cameraPosition: cameraPositionRef.current,
            cameraTarget: cameraTargetRef.current,
          },
        ]);
      }
    };

    const handleAnnotationClick = (e: any) => {
      zoomToAnnotation(e.detail);
    };

    function isFacingCamera(position: Vector3, normal: Vector3): boolean {
      const cameraDirection: Vector3 = camera.position.clone().normalize().sub(position.clone().normalize());
      const dotProduct: number = cameraDirection.dot(normal);

      if (dotProduct < DOT_PRODUCT_THRESHOLD) {
        return false;
      }

      return true;
    }

    function checkAnnotationsFacingCamera() {
      // loop through all annotations and check if their normals
      // are facing towards or away from the camera

      const annosChanged = lastAnnoLength.current !== annotations.length;

      // if the number of annotations has changed, then we need to
      // check the normals immediately
      if (annosChanged) {
        annotationsFacingCameraCheckMS = 1;
      } else {
        annotationsFacingCameraCheckMS = 10;
      }

      annotations.forEach((anno: Annotation, idx: number) => {
        const annoEl: HTMLElement = document.getElementById(`anno-${idx}`)!;

        if (annosChanged) {
          annoEl.classList.add('no-fade');
        } else {
          annoEl.classList.remove('no-fade');
        }

        if (isFacingCamera(anno.position, anno.normal)) {
          annoEl.classList.remove('facing-away');
        } else {
          annoEl.classList.add('facing-away');
        }
      });

      lastAnnoLength.current = annotations.length;
    }

    useEffect(() => {
      // check the whether annotations are facing the camera
      const interval = setInterval(() => {
        checkAnnotationsFacingCamera();
      }, annotationsFacingCameraCheckMS);

      return () => clearInterval(interval);
    }, []);

    return (
      <>
        {annotations.map((anno, idx) => {
          return (
            <React.Fragment key={idx}>
              {arrowHelpersEnabled && <arrowHelper args={[anno.normal, anno.position, 0.05, 0xffffff]} />}
              <Html
                position={anno.position}
                style={{
                  width: 0,
                  height: 0,
                }}>
                <div id={`anno-${idx}`} className="annotation">
                  <div
                    className="circle"
                    onClick={(e) => {
                      if (isFacingCamera(anno.position, anno.normal)) {
                        // console.log(`clicked ${idx}`);
                        triggerEvent(ANNO_CLICK, anno);
                      }
                    }}>
                    <span className="label">{idx + 1}</span>
                  </div>
                </div>
              </Html>
            </React.Fragment>
          );
        })}
      </>
    );
  }

  function onCameraChange(e: any) {
    if (e.type !== 'update') {
      return;
    }

    // get current camera position
    const cameraPosition: Vector3 = new Vector3();
    cameraControlsRef.current!.getPosition(cameraPosition);
    cameraPositionRef.current = cameraPosition;

    // get current camera target
    const cameraTarget: Vector3 = new Vector3();
    cameraControlsRef.current!.getTarget(cameraTarget);
    cameraTargetRef.current = cameraTarget;

    triggerEvent(CAMERA_UPDATE, {
      cameraPosition,
      cameraTarget,
    });
  }

  return (
    <>
      {/* <PerspectiveCamera position={[0, 0, 2]} near={0.01} /> */}
      {orthographicEnabled ? (
        <>
          <OrthographicCamera makeDefault position={[0, 0, 2]} near={0} zoom={200} />
        </>
      ) : (
        <>
          <PerspectiveCamera position={[0, 0, 2]} fov={50} near={0.01} />
        </>
      )}
      <CameraControls
        ref={cameraControlsRef}
        minDistance={minDistance}
        onChange={(e: any) => {
          onCameraChange(e);
        }}
      />
      <ambientLight intensity={ambientLightIntensity} />
      <Bounds lineVisible={boundsEnabled}>
        <Suspense fallback={<Loader />}>
          {srcs.map((src, index) => {
            return <GLTF key={index} {...src} />;
          })}
        </Suspense>
      </Bounds>
      <Environment preset={environment} />
      <Annotations />
      {gridEnabled && <gridHelper args={[100, 100]} />}
      {axesEnabled && <axesHelper args={[5]} />}
    </>
  );
}

const Viewer = (props: ViewerProps, ref: ((instance: unknown) => void) | RefObject<unknown> | null | undefined) => {
  useImperativeHandle(ref, () => ({
    home: () => {
      triggerEvent(HOME_CLICK);
    },
  }));

  return (
    <Canvas
      onDoubleClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        triggerEvent(DBL_CLICK, e);
      }}>
      <Scene {...props} />
    </Canvas>
  );
};

export default forwardRef(Viewer);
