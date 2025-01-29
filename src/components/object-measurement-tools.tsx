import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import useStore from '@/Store';
import { Intersection, Matrix4, Object3D, Object3DEventMap, Vector3 } from 'three';
import { useEventTrigger } from '@/lib/hooks/use-event';
import { ObjectMeasurement, CAMERA_CONTROLS_ENABLED } from '@/types';
import React from 'react';
import { Html } from '@react-three/drei';
import { cn, getElementTranslate, setElementTranslate } from '@/lib/utils';
import { useDrag } from '@use-gesture/react';
import useKeyDown from '@/lib/hooks/use-key-press';

export function ObjectMeasurementTools({ rotationMatrixRef }: { rotationMatrixRef: React.MutableRefObject<Matrix4> }) {
  const { 
    objectMeasurements: measurements, 
    setObjectMeasurements: setMeasurements, 
    measurementUnits,
  } = useStore();
  const { scene, camera, pointer, raycaster, size } = useThree();

  // if a dot product is less than this, then the normal is facing away from the camera
  const DOT_PRODUCT_THRESHOLD = Math.PI * -0.1;

  const dragRef = useRef<number | null>(null);

  const v1 = new Vector3();
  const v2 = new Vector3();
  const v3 = new Vector3();

  useKeyDown('Delete', () => {
    // delete measurement
    if (selectedMeasurementRef.current !== null) {
      setMeasurements(measurements.filter((_measurement, index) => index !== selectedMeasurementRef.current));
    }
    setSelectedMeasurement(measurements.length ? measurements.length - 2 : null);
  });

  const selectedMeasurementRef = useRef<number | null>(null);

  function setSelectedMeasurement(index: number | null) {
    selectedMeasurementRef.current = index;

    // find the selected measurement point and update class
    const measurementPointEls = Array.from(document.getElementsByClassName('point')) as HTMLElement[];

    for (let i = 0; i < measurementPointEls.length; i++) {
      const pointEl = measurementPointEls[i] as HTMLElement;
      pointEl.classList.remove('selected');

      if (index !== null && i === index) {
        pointEl.classList.add('selected');
      }
    }
  }

  // https://github.com/pmndrs/drei/blob/master/src/web/Html.tsx#L25
  function calculateScreenPosition(position: Vector3) {
    const objectPos = v1.copy(position).applyMatrix4(rotationMatrixRef.current);
    objectPos.project(camera);
    const widthHalf = size.width / 2;
    const heightHalf = size.height / 2;
    return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf];
  }

  function isFacingCamera(measurement: ObjectMeasurement): boolean {
    const cameraDirection: Vector3 = camera.position.clone().normalize().sub(
      measurement.position!.clone().normalize().applyMatrix4(rotationMatrixRef.current)
    );
    const dotProduct: number = cameraDirection.dot(measurement.normal!.clone().applyMatrix4(rotationMatrixRef.current));

    if (dotProduct < DOT_PRODUCT_THRESHOLD) {
      return false;
    }

    return true;
  }

  function updatePointPositions() {
    measurements.forEach((measurement: ObjectMeasurement, idx: number) => {
      const point: HTMLElement = document.getElementById(`point-${idx}`)!;

      // if not dragging the point, update its position
      if (dragRef.current !== idx) {
        const [x, y] = calculateScreenPosition(measurement.position!);
        setElementTranslate(point, x, y);
      }

      if (isFacingCamera(measurement)) {
        point?.classList.remove('facing-away');
      } else {
        point?.classList.add('facing-away');
      }
    });
  }

  function updateRulerPositions() {
    const lineEls = document.getElementsByClassName('ruler-line');

    const points = document.getElementsByClassName('point');

    for (let i = 0; i < points.length; i++) {
      const point = points[i] as HTMLElement;
      const idx = Number(point.getAttribute('data-idx'));
      const translateValues = getElementTranslate(point);

      // for each lineEl, update the x1, y1, x2, y2 attributes using the data-idx0 and data-idx1 attributes
      for (let j = 0; j < lineEls.length; j++) {
        const lineEl = lineEls[j] as SVGLineElement;
        const idx0 = Number(lineEl.getAttribute('data-idx0'));
        const idx1 = Number(lineEl.getAttribute('data-idx1'));

        if (idx0 === idx) {
          lineEl.setAttribute('x1', String(translateValues![0]));
          lineEl.setAttribute('y1', String(translateValues![1]));
        } else if (idx1 === idx) {
          lineEl.setAttribute('x2', String(translateValues![0]));
          lineEl.setAttribute('y2', String(translateValues![1]));
        }
      }
    }
  }

  function updateMeasurementLabels() {
    // for each label, update the x, y attributes using the data-idx0 and data-idx1 attributes
    const labels = document.getElementsByClassName('measurement-label');

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i] as SVGForeignObjectElement;
      const idx0 = Number(label.getAttribute('data-idx0'));
      const idx1 = Number(label.getAttribute('data-idx1'));

      const pos2D1: number[] = calculateScreenPosition(measurements[idx0].position!);
      const pos2D2: number[] = calculateScreenPosition(measurements[idx1].position!);

      const avgX = (pos2D1[0] + pos2D2[0]) / 2;
      const avgY = (pos2D1[1] + pos2D2[1]) / 2;

      label.setAttribute('x', String(avgX - 30));
      label.setAttribute('y', String(avgY - 15));

      const pos3D1: Vector3 = measurements[idx0].position!;
      const pos3D2: Vector3 = measurements[idx1].position!;

      const dir = pos3D2.clone().sub(pos3D1);
      let worldDistance = dir.length();

      if (measurementUnits === 'mm') {
        worldDistance *= 1000;
        // round to three decimal places
        worldDistance = parseFloat(worldDistance.toFixed(3));
      } else {
        // round to three decimal places
        worldDistance = parseFloat(worldDistance.toFixed(3));
      }

      label.innerHTML = `
        <div>
          ${worldDistance == 0 ? '<0.001' : worldDistance} ${measurementUnits}
        </div>
      `;
    }
  }

  function updateAngleLabels() {
    // for each label, update the x, y attributes using the data-idx0, data-idx1, and data-idx2 attributes
    const labels = document.getElementsByClassName('angle-label');

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i] as SVGForeignObjectElement;

      const idx0 = Number(label.getAttribute('data-idx0'));
      const idx1 = Number(label.getAttribute('data-idx1'));
      const idx2 = Number(label.getAttribute('data-idx2'));

      const pos2D1: number[] = calculateScreenPosition(measurements[idx0].position!);
      const pos2D2: number[] = calculateScreenPosition(measurements[idx1].position!);
      const pos2D3: number[] = calculateScreenPosition(measurements[idx2].position!);

      const line1 = {
        x1: pos2D1[0],
        y1: pos2D1[1],
        x2: pos2D2[0],
        y2: pos2D2[1],
      };

      const line2 = {
        x1: pos2D2[0],
        y1: pos2D2[1],
        x2: pos2D3[0],
        y2: pos2D3[1],
      };

      // Calculate the angle between the three points
      const angle = calculateAngle(
        measurements[idx0].position!,
        measurements[idx1].position!,
        measurements[idx2].position!
      );

      // Calculate the direction vectors of the lines
      const dir1 = { x: line1.x1 - line1.x2, y: line1.y1 - line1.y2 };
      const dir2 = { x: line2.x2 - line2.x1, y: line2.y2 - line2.y1 };

      // Normalize the direction vectors
      const magnitude1 = Math.sqrt(dir1.x * dir1.x + dir1.y * dir1.y);
      const magnitude2 = Math.sqrt(dir2.x * dir2.x + dir2.y * dir2.y);
      const normDir1 = { x: dir1.x / magnitude1, y: dir1.y / magnitude1 };
      const normDir2 = { x: dir2.x / magnitude2, y: dir2.y / magnitude2 };

      // Calculate the midpoint of the normalized direction vectors
      const midDir = { x: (normDir1.x + normDir2.x) / 2, y: (normDir1.y + normDir2.y) / 2 };

      // Calculate the magnitude of the midpoint direction
      const midMagnitude = Math.sqrt(midDir.x * midDir.x + midDir.y * midDir.y);

      // Normalize the midpoint direction
      const normalizedMidDir = {
        x: midDir.x / midMagnitude,
        y: midDir.y / midMagnitude,
      };

      // Define the offset distance
      const offsetDistance = 50;

      // Calculate the position for the text
      const textPosition = {
        x: (line1.x2 + line2.x1) / 2 + normalizedMidDir.x * offsetDistance,
        y: (line1.y2 + line2.y1) / 2 + normalizedMidDir.y * offsetDistance,
      };

      label.setAttribute('x', String(textPosition.x - 30));
      label.setAttribute('y', String(textPosition.y - 15));

      label.innerHTML = `
          <div>
            ${angle.toFixed(2)}°
          </div>
        `;
    }
  }

  // update overlaid DOM elements every frame
  useFrame(() => {
    updatePointPositions();
    updateRulerPositions();
    updateMeasurementLabels();
    updateAngleLabels();
  });

  const triggerCameraControlsEnabledEvent = useEventTrigger(CAMERA_CONTROLS_ENABLED);

  const bind = useDrag((state) => {
    const el = state.currentTarget as HTMLDivElement;

    // get the element's index from the data-index attribute
    const idx = parseInt(el.getAttribute('data-idx')!);

    if (!isFacingCamera(measurements[idx])) {
      return;
    }

    let x;
    let y;

    if (!state.memo) {
      // just started dragging. use the initial position
      const translateValues = getElementTranslate(el);
      if (translateValues) {
        x = translateValues[0];
        y = translateValues[1];
      }
    } else {
      // continued dragging. use the memo'd initial position plus the movement
      x = state.memo[0] + state.movement[0];
      y = state.memo[1] + state.movement[1];

      // if the measurement has moved, set the dragRef to the index
      if (x !== state.memo[0] || y !== state.memo[1]) {
        dragRef.current = idx;
      }
    }

    // set element position without updating state (that happens on MouseUp event)
    setElementTranslate(el, x, y);

    // memo the initial position
    if (!state.memo) {
      return [x, y];
    } else {
      return state.memo;
    }
  });

  function showLabels() {
    // show all measurement-labels
    const measurementLabels = document.getElementsByClassName('measurement-label');
    for (let i = 0; i < measurementLabels.length; i++) {
      const labelEl = measurementLabels[i] as SVGForeignObjectElement;
      labelEl.classList.remove('hidden');
    }
    // show all angle-labels
    const angleLabels = document.getElementsByClassName('angle-label');
    for (let i = 0; i < angleLabels.length; i++) {
      const labelEl = angleLabels[i] as SVGForeignObjectElement;
      labelEl.classList.remove('hidden');
    }
  }

  function hideLabels() {
    // hide all measurement-labels
    const measurementLabels = document.getElementsByClassName('measurement-label');
    for (let i = 0; i < measurementLabels.length; i++) {
      const labelEl = measurementLabels[i] as SVGForeignObjectElement;
      labelEl.classList.add('hidden');
    }
    // hide all angle-labels
    const angleLabels = document.getElementsByClassName('angle-label');
    for (let i = 0; i < angleLabels.length; i++) {
      const labelEl = angleLabels[i] as SVGForeignObjectElement;
      labelEl.classList.add('hidden');
    }
  }

  function getIntersects(): Intersection<Object3D<Object3DEventMap>>[] {
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(scene.children, true);
  }

  function Ruler({ idx0, idx1, width = 2 }: { idx0: number; idx1: number; width?: number }) {
    return (
      <>
        <line
          className="ruler-line"
          data-idx0={idx0}
          data-idx1={idx1}
          stroke="black"
          strokeWidth={width}
          strokeDasharray="5,5"
        />
        <line
          className="ruler-line"
          data-idx0={idx0}
          data-idx1={idx1}
          stroke="white"
          strokeWidth={width}
          strokeDasharray="5,5"
          strokeDashoffset="5"
        />
        <foreignObject className="measurement-label" data-idx0={idx0} data-idx1={idx1}></foreignObject>
      </>
    );
  }

  function Angle({ idx0, idx1, idx2 }: { idx0: number; idx1: number; idx2: number }) {
    return <foreignObject className="angle-label" data-idx0={idx0} data-idx1={idx1} data-idx2={idx2}></foreignObject>;
  }

  function calculateAngle(point1: Vector3, point2: Vector3, point3: Vector3) {
    // Create vectors
    const vector1 = v2.subVectors(point2, point1);
    const vector2 = v3.subVectors(point2, point3);

    // Normalize the vectors
    vector1.normalize();
    vector2.normalize();

    // Calculate the dot product of vector1 and vector2
    const dotProduct = vector1.dot(vector2);

    // Clamp the value of dotProduct between -1 and 1
    const clampedDotProduct = Math.max(-1, Math.min(1, dotProduct));

    // Calculate the angle in radians
    const angleRadians = Math.acos(clampedDotProduct);

    // Convert the angle to degrees
    const angleDegrees = angleRadians * (180 / Math.PI);

    return angleDegrees;
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
          const intersects: Intersection<Object3D>[] = getIntersects();

          if (intersects.length > 0) {
            setMeasurements([
              ...measurements,
              {
                position: intersects[0].point.applyMatrix4(rotationMatrixRef.current.clone().invert()),
                normal: intersects[0].face?.normal,
              },
            ]);

            // setSelectedMeasurement(measurement.length);
          }
        }}>
        {/* draw rulers */}
        {measurements.map((_measurement: ObjectMeasurement, index: number) => {
          // const nextPosition = measurements[index + 1]?.position;
          if (index < measurements.length - 1) {
            return <Ruler key={index} idx0={index} idx1={index + 1} />;
          }
          return null;
        })}
        {/* draw angles */}
        {measurements.map((_measurement: ObjectMeasurement, index: number) => {
          if (!measurements[index + 2]) {
            return null;
          }

          return <Angle key={index} idx0={index} idx1={index + 1} idx2={index + 2} />;
        })}
        {/* draw points */}
        {measurements.map((measurement: ObjectMeasurement, index: number) => {
          return (
            <React.Fragment key={index}>
              <g
                {...bind()}
                id={`point-${index}`}
                data-idx={index}
                className={cn('point')}
                onMouseDown={(_e: React.MouseEvent<SVGElement>) => {
                  if (isFacingCamera(measurement)) {
                    triggerCameraControlsEnabledEvent(false);
                    hideLabels();
                  }
                }}
                onMouseUp={(_e: React.MouseEvent<SVGElement>) => {
                  if (isFacingCamera(measurement)) {
                    // if dragging this point
                    if (dragRef.current === index) {
                      const intersects: Intersection<Object3D>[] = getIntersects();

                      if (intersects.length > 0) {
                        // update annotation position
                        setMeasurements(
                          measurements.map((measurement: ObjectMeasurement, idx: number) => {
                            if (idx === index) {
                              return {
                                ...measurement,
                                position: intersects[0].point.applyMatrix4(rotationMatrixRef.current.clone().invert()),
                                normal: intersects[0].face?.normal,
                              };
                            }
                            return measurement;
                          })
                        );
                      }

                      dragRef.current = null;
                    } else {
                      setSelectedMeasurement(index);
                    }

                    triggerCameraControlsEnabledEvent(true);
                    showLabels();
                  }
                }}>
                <circle r="8" />
              </g>
            </React.Fragment>
          );
        })}
      </svg>
    </Html>
  );
}
