import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useStore from '@/Store';
import { Intersection, Matrix4, Object3D, Sphere, Vector3 } from 'three';
import { useEventListener, useEventTrigger } from '@/lib/hooks/use-event';
import { ANNO_CLICK, Annotation, CAMERA_CONTROLS_ENABLED, CAMERA_LOADING_DONE, CameraRefs } from '@/types';
import React from 'react';
import { Html } from '@react-three/drei';
import { applyMatrix4Inverse, calculateScreenPosition, cn, getIntersects, getIntersectsPoints, isFacingCamera } from '@/lib/utils';
import { useDrag } from '@use-gesture/react';
// @ts-ignore
import DOMPurify from 'dompurify';

export function AnnotationTools({
  cameraRefs,
  boundsSphereRef,
  rotationMatrixRef,
  viewOnly
}: {
  cameraRefs: CameraRefs,
  boundsSphereRef: React.MutableRefObject<Sphere | null>,
  rotationMatrixRef: React.MutableRefObject<Matrix4>,
  viewOnly?: boolean
}) {
  const {
    annotations,
    setAnnotations,
    selectedAnnotation,
    setSelectedAnnotation
  } = useStore();
  const { scene, camera, pointer, raycaster, size } = useThree();

  const dragRef = useRef<number | null>(null);

  const v1 = new Vector3();
  const v2 = new Vector3();

  function initializeAnnotations() {
    setAnnotations(annotations.map(anno => {
      let intersects = null;
      if (!anno.normal && boundsSphereRef.current) {
        // Use face intersecting vector from anno to scene center for normal
        // To account for annos inside models, cast from position beyond anno to center
        intersects = getIntersectsPoints(scene,
          v1.subVectors(anno.position!, boundsSphereRef.current.center).multiplyScalar(1.1).add(boundsSphereRef.current.center),
          boundsSphereRef.current.center,
          raycaster
        );

        if (intersects.length > 0) anno.normal = intersects[0].face?.normal;
      }

      if (!anno.cameraPosition) {
        if (intersects && intersects.length > 0 && intersects[0].face && boundsSphereRef.current) {
          // Use normal of intersecting face to calculate camera position
          cameraRefs.controls.current!.getPosition(v1);
          const distance = v1.distanceTo(boundsSphereRef.current!.center);

          v2.copy(intersects[0].face?.normal).normalize().multiplyScalar(distance).add(boundsSphereRef.current!.center);
          anno.cameraPosition = applyMatrix4Inverse(v2, rotationMatrixRef.current);
        } else {
          // Use default camera position
          cameraRefs.controls.current!.getPosition(v1);
          anno.cameraPosition = applyMatrix4Inverse(v1, rotationMatrixRef.current);
        }
      }

      if (!anno.cameraTarget) {
        // Use default camera target
        cameraRefs.controls.current!.getTarget(v1);
        anno.cameraTarget = applyMatrix4Inverse(v1, rotationMatrixRef.current);
      }

      return anno;
    }));
  }

  const handleCameraLoadingDone = () => {
    initializeAnnotations();
  };

  useEventListener(CAMERA_LOADING_DONE, handleCameraLoadingDone);

  function zoomToAnnotation(annotation: Annotation) {
    if (annotation.cameraPosition && annotation.cameraTarget) {
      v1.copy(annotation.cameraPosition).applyMatrix4(rotationMatrixRef.current);
      v2.copy(annotation.cameraTarget!).applyMatrix4(rotationMatrixRef.current);

      cameraRefs.controls.current!.setLookAt(
        v1.x,
        v1.y,
        v1.z,
        v2.x,
        v2.y,
        v2.z,
        true
      )
    }
  }

  const handleAnnotationClick = (e: any) => {
    zoomToAnnotation(e.detail);
  };

  useEventListener(ANNO_CLICK, handleAnnotationClick);

  const triggerAnnoClick = useEventTrigger(ANNO_CLICK);

  function updateAnnotationPosition(idx: number, x: number, y: number) {
    const annoEl: HTMLElement = document.getElementById(`point-${idx}`)!;

    if (annoEl) {
      annoEl.setAttribute('transform', `translate(${x}, ${y})`);
    }
  }

  function updateAnnotationPositions() {
    annotations.forEach((anno: Annotation, idx: number) => {
      // if not dragging the annotation, update its position
      if (dragRef.current !== idx) {
        const [x, y] = calculateScreenPosition(anno.position!, rotationMatrixRef, camera, size);
        updateAnnotationPosition(idx, x, y);
      }
    });
  }

  function checkAnnotationsFacingCamera() {
    // loop through all annotations and check if their normals
    // are facing towards or away from the camera

    annotations.forEach((anno: Annotation, idx: number) => {
      const annoEl: HTMLElement = document.getElementById(`point-${idx}`)!;

      if (annoEl) {
        if (isFacingCamera(anno.position!, anno.normal!, camera, rotationMatrixRef)) {
          annoEl.classList.remove('facing-away');
        } else {
          annoEl.classList.add('facing-away');
        }
      }
    });
  }

  useFrame(() => {
    updateAnnotationPositions();
    checkAnnotationsFacingCamera();
  });

  const triggerCameraControlsEnabledEvent = useEventTrigger(CAMERA_CONTROLS_ENABLED);

  const bind = useDrag((state) => {
    if (viewOnly) return;

    const el = state.currentTarget as HTMLDivElement;

    // get the element's index from the data-index attribute
    const idx = parseInt(el.getAttribute('data-idx')!);

    if (!isFacingCamera(annotations[idx].position!, annotations[idx].normal!, camera, rotationMatrixRef)) {
      return;
    }

    let x;
    let y;

    if (!state.memo) {
      // just started dragging. use the initial position
      const transformValue = el.getAttribute('transform');
      let translateValues: string[] | null = null;
      if (transformValue) {
        const match = transformValue.match(/translate\(([^)]+)\)/);
        if (match) {
          translateValues = match[1].split(', ');
        }
      }
      if (translateValues) {
        x = Number(translateValues[0]);
        y = Number(translateValues[1]);
      }
    } else {
      // continued dragging. use the memo'd initial position plus the movement
      x = state.memo[0] + state.movement[0];
      y = state.memo[1] + state.movement[1];

      // if the annotation has moved, set the dragRef to the index
      if (x !== state.memo[0] || y !== state.memo[1]) {
        dragRef.current = idx;
      }
    }

    // set element position without updating state (that happens on MouseUp event)
    updateAnnotationPosition(idx, x, y);

    // memo the initial position
    if (!state.memo) {
      return [x, y];
    } else {
      return state.memo;
    }
  });

  function drawAnnotations() {
    let primaryAnnotation: Annotation | null = null;
    let primaryIndex: number | null = null;
    const fragments = [];

    annotations.map((anno: Annotation, index: number) => {
      if (selectedAnnotation == index) {
        primaryAnnotation = anno;
        primaryIndex = index;
      } else {
        fragments.push(drawAnnotation(anno, index));
      }
    });

    // Draw selected Annotation last so it overlaps others
    if (primaryAnnotation && primaryIndex != null) {
      fragments.push(drawAnnotation(primaryAnnotation, primaryIndex));
    }

    return fragments;
  }

  function drawAnnotation(anno: Annotation, index: number) {
    return (
      <React.Fragment key={index}>
        <g
          {...bind()}
          id={`point-${index}`}
          data-idx={index}
          className={cn('point', {
            selected: selectedAnnotation === index,
          })}
          onMouseDown={(_e: React.MouseEvent<SVGElement>) => {
            if (isFacingCamera(anno.position!, anno.normal!, camera, rotationMatrixRef)) {
              triggerCameraControlsEnabledEvent(false);
            }
          }}
          onMouseUp={(_e: React.MouseEvent<SVGElement>) => {
            if (isFacingCamera(anno.position!, anno.normal!, camera, rotationMatrixRef)) {
              // if was dragging this annotation
              if (dragRef.current === index && !viewOnly) {
                const intersects: Intersection<Object3D>[] = getIntersects(scene, camera, pointer, raycaster);

                if (intersects.length > 0) {
                  // update annotation position
                  setAnnotations(
                    annotations.map((anno: Annotation, idx: number) => {
                      if (idx === index) {
                        return {
                          ...anno,
                          position: applyMatrix4Inverse(intersects[0].point, rotationMatrixRef.current),
                          normal: intersects[0].face?.normal,
                          cameraPosition: applyMatrix4Inverse(cameraRefs.position.current!, rotationMatrixRef.current),
                          cameraTarget: applyMatrix4Inverse(cameraRefs.target.current!, rotationMatrixRef.current),
                        };
                      }
                      return anno;
                    })
                  );
                }

                dragRef.current = null;
              } else {
                setSelectedAnnotation(index);
                triggerAnnoClick(anno);
              }

              triggerCameraControlsEnabledEvent(true);
            }
          }}>
          <circle r="11" />
          <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="black">
            {index + 1}
          </text>
          {selectedAnnotation === index && anno && anno.label && (
            <foreignObject width="200" height={anno.description ? 80 : 38} x="18">
              <div className="text">
                <div className="label">{anno.label}</div>
                {anno.description && (
                  <div
                    className="description"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(anno.description, {
                        ALLOWED_TAGS: ['img', 'a', 'b', 'i', 'em', 'strong', 'p', 'br'],
                        ALLOWED_ATTR: ['href', 'src', 'alt', 'target'],
                      }),
                    }}
                  />
                )}
              </div>
            </foreignObject>
          )}
        </g>
      </React.Fragment>
    );
  }

  return (
    <Html
      zIndexRange={[50, 0]}
      calculatePosition={() => {
        return [0, 0];
      }}
      style={{
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}>
      <svg
        width="100vw"
        height="100vh"
        onDoubleClick={(_e: React.MouseEvent<SVGElement>) => {
          if (viewOnly) return;

          const intersects: Intersection<Object3D>[] = getIntersects(scene, camera, pointer, raycaster);

          if (intersects.length > 0) {
            setAnnotations([
              ...annotations,
              {
                position: applyMatrix4Inverse(intersects[0].point, rotationMatrixRef.current),
                normal: intersects[0].face?.normal,
                cameraPosition: applyMatrix4Inverse(cameraRefs.position.current!, rotationMatrixRef.current),
                cameraTarget: applyMatrix4Inverse(cameraRefs.target.current!, rotationMatrixRef.current),
              },
            ]);

            setSelectedAnnotation(annotations.length);
          }
        }}>
        { drawAnnotations() }
      </svg>
    </Html>
  );
}
