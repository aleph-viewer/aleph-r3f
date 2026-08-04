import useStore from '@/Store';
import { CAMERA_CONTROLS_ENABLED, CAMERA_UPDATE, DRAGGING_MEASUREMENT, DROPPED_MEASUREMENT, ScreenMeasurement } from '@/types';
import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useEventListener, useEventTrigger } from '@/lib/hooks/use-event';
import { useDrag } from '@use-gesture/react';
import { useFrame, useThree } from '@react-three/fiber';
import { cn } from '@/lib/utils';
import useKeyDown from '@/lib/hooks/use-key-press';

export function ScreenMeasurementTools() {
  const { screenMeasurements: measurements, setScreenMeasurements: setMeasurements, measurementUnits } = useStore();
  const { camera } = useThree();

  const dragRef = useRef<number | null>(null);

  const triggerCameraControlsEnabledEvent = useEventTrigger(CAMERA_CONTROLS_ENABLED);

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
    const measurementPointEls = document.getElementsByClassName('point');

    for (let i = 0; i < measurementPointEls.length; i++) {
      const pointEl = measurementPointEls[i] as SVGElement;
      pointEl.classList.remove('selected');

      if (index !== null && i === index) {
        pointEl.classList.add('selected');
      }
    }
  }

  function Ruler({ idx0, idx1, width = 2 }: { idx0: number; idx1: number; width?: number }) {
    const position = measurements[idx0]?.position;
    const nextPosition = measurements[idx1]?.position;

    const worldDistance = calculateWorldDistance(position[0], nextPosition[0], position[1], nextPosition[1]);

    const avgX = (position[0] + nextPosition[0]) / 2;
    const avgY = (position[1] + nextPosition[1]) / 2;

    return (
      <>
        <line
          className="ruler-line"
          data-idx0={idx0}
          data-idx1={idx1}
          x1={position[0]}
          y1={position[1]}
          x2={nextPosition[0]}
          y2={nextPosition[1]}
          stroke="black"
          strokeWidth={width}
          strokeDasharray="5,5"
        />
        <line
          className="ruler-line"
          data-idx0={idx0}
          data-idx1={idx1}
          x1={position[0]}
          y1={position[1]}
          x2={nextPosition[0]}
          y2={nextPosition[1]}
          stroke="white"
          strokeWidth={width}
          strokeDasharray="5,5"
          strokeDashoffset="5"
        />
        <foreignObject 
          className="measurement-label"
          x={avgX - 50}
          y={avgY - 15}
          data-idx0={idx0}
          data-idx1={idx1}
          x1={position[0]}
          y1={position[1]}
          x2={nextPosition[0]}
          y2={nextPosition[1]}
        >
          <div>
            {worldDistance == 0 ? '<0.001' : worldDistance} {measurementUnits}
          </div>
        </foreignObject>
      </>
    );
  }

  function updatePointPosition(idx: number, x: number, y: number) {
    const measurementEl: HTMLElement = document.getElementById(`point-${idx}`)!;

    if (measurementEl) {
      measurementEl.setAttribute('transform', `translate(${x}, ${y})`);
    } else {
      console.error('could not find element');
    }
  }

  function updatePointPositions() {
    measurements.forEach((measurement: ScreenMeasurement, idx: number) => {
      // if not dragging the annotation, update its position
      if (dragRef.current !== idx) {
        const [x, y] = measurement.position;
        updatePointPosition(idx, x, y);
      }
    });
  }

  function updateRulerPositions() {
    const lineEls = document.getElementsByClassName('ruler-line');

    const points = document.getElementsByClassName('point');

    for (let i = 0; i < points.length; i++) {
      const point = points[i] as HTMLElement;
      const idx = Number(point.getAttribute('data-idx'));
      const translateValues = getTranslateValues(point);

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

    // todo: update the text of the measurement-labels
    // this should always be happening on frame here, not when rendered
  }

  function getTranslateValues(el: any): number[] | null {
    let x: number;
    let y: number;

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

      return [x, y];
    }

    return null;
  }

  function updateMeasurementLabels() {
    const labels = document.getElementsByClassName('measurement-label');
    for (let i = 0; i < labels.length; i++) {
      const x1 = Number(labels[i].getAttribute('x1'));
      const x2 = Number(labels[i].getAttribute('x2'));
      const y1 = Number(labels[i].getAttribute('y1'));
      const y2 = Number(labels[i].getAttribute('y2'));

      const worldDistance = calculateWorldDistance(x1, x2, y1, y2);

      if (labels[i].firstElementChild) {
        labels[i].firstElementChild!.textContent = `
          ${worldDistance == 0 ? '<0.001' : worldDistance}
          ${measurementUnits}
        `;
      }
    }
  }

  function calculateWorldDistance(x1: number, x2: number, y1: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let worldDistance = distance / camera.zoom;
    if (measurementUnits === 'mm') worldDistance *= 1000;

    // round to three decimal places
    worldDistance = parseFloat(worldDistance.toFixed(3));

    return worldDistance;
  }

  useFrame(() => {
    updatePointPositions();
    updateRulerPositions();
  });

  const handleCameraUpdateEvent = () => {
    updateMeasurementLabels();
  };

  useEventListener(CAMERA_UPDATE, handleCameraUpdateEvent);

  function Measurements() {
    const triggerDraggingMeasurementEvent = useEventTrigger(DRAGGING_MEASUREMENT);
    const triggerDroppedMeasurementEvent = useEventTrigger(DROPPED_MEASUREMENT);

    const bind = useDrag((state) => {
      triggerDraggingMeasurementEvent();

      const el = state.currentTarget as SVGElement;

      // get the element's index from the data-index attribute
      const idx = parseInt(el.getAttribute('data-idx')!);

      let x;
      let y;

      if (!state.memo) {
        // just started dragging. use the initial position
        const currentPos = getTranslateValues(el);
        x = currentPos![0];
        y = currentPos![1];
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
      updatePointPosition(idx, x, y);

      // hide all measurement-labels
      const measurementLabelEls = document.getElementsByClassName('measurement-label');

      for (let i = 0; i < measurementLabelEls.length; i++) {
        const labelEl = measurementLabelEls[i] as SVGForeignObjectElement;
        labelEl.classList.add('hidden');
      }

      // hide all angle-labels
      const angleLabelEls = document.getElementsByClassName('angle-label');

      for (let i = 0; i < angleLabelEls.length; i++) {
        const labelEl = angleLabelEls[i] as SVGForeignObjectElement;
        labelEl.classList.add('hidden');
      }

      // memo the initial position
      if (!state.memo) {
        return [x, y];
      } else {
        return state.memo;
      }
    });

    function getSVGMousePosition(e: React.MouseEvent<SVGElement>): [number, number] {
      const parentNode = e.currentTarget.parentNode as HTMLElement;

      // get parentNode offset
      const rect = parentNode.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      return [x, y];
    }

    function calculateAngle(line1: any, line2: any) {
      // Calculate direction vectors
      const dir1 = { x: line1.x1 - line1.x2, y: line1.y1 - line1.y2 };
      const dir2 = { x: line2.x2 - line2.x1, y: line2.y2 - line2.y1 };

      // Calculate the dot product
      const dotProduct = dir1.x * dir2.x + dir1.y * dir2.y;

      // Calculate the magnitudes of the vectors
      const mag1 = Math.sqrt(dir1.x * dir1.x + dir1.y * dir1.y);
      const mag2 = Math.sqrt(dir2.x * dir2.x + dir2.y * dir2.y);

      // Calculate the cosine of the angle
      const cosTheta = dotProduct / (mag1 * mag2);

      // Calculate the angle in radians
      const angleRadians = Math.acos(cosTheta);

      // Convert to degrees
      let angleDegrees = angleRadians * (180 / Math.PI);

      // Ensure the angle is not more than 180
      if (angleDegrees > 180) {
        angleDegrees = 360 - angleDegrees;
      }

      return angleDegrees;
    }

    function Angle({
      point1,
      point2,
      point3,
    }: {
      point1: [number, number];
      point2: [number, number];
      point3: [number, number];
    }) {
      const line1 = {
        x1: point1[0],
        y1: point1[1],
        x2: point2[0],
        y2: point2[1],
      };

      const line2 = {
        x1: point2[0],
        y1: point2[1],
        x2: point3[0],
        y2: point3[1],
      };

      // Calculate the angle
      const angle = calculateAngle(line1, line2);

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

      return (
        <>
          <foreignObject className="angle-label" x={textPosition.x - 30} y={textPosition.y - 15}>
            <div>{angle.toFixed(2)}°</div>
          </foreignObject>
        </>
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
          onDoubleClick={(e: React.MouseEvent<SVGElement>) => {
            // setCameraControlsEnabled(false);

            const mousePos: [number, number] = getSVGMousePosition(e);

            setMeasurements([
              ...measurements,
              {
                position: mousePos,
              },
            ]);

            setSelectedMeasurement(measurements.length);
          }}>
          {/* draw rulers */}
          {measurements.map((_measurement: ScreenMeasurement, index: number) => {
            // const nextPosition = measurements[index + 1]?.position;
            if (index < measurements.length - 1) {
              return <Ruler key={index} idx0={index} idx1={index + 1} />;
            }
            return null;
          })}
          {/* draw angles */}
          {measurements.map((_measurement: ScreenMeasurement, index: number) => {
            if (!measurements[index + 2]) {
              return null;
            }

            return (
              <Angle
                key={index}
                point1={measurements[index].position}
                point2={measurements[index + 1].position}
                point3={measurements[index + 2].position}
              />
            );
          })}
          {/* draw points */}
          {measurements.map((_measurement: ScreenMeasurement, index: number) => {
            return (
              <React.Fragment key={index}>
                <g
                  {...bind()}
                  id={`point-${index}`}
                  data-idx={index}
                  className={cn('point', {
                    // selected: selectedMeasurement === index,
                  })}
                  onMouseDown={(_e: React.MouseEvent<SVGElement>) => {
                    triggerCameraControlsEnabledEvent(false);
                    setSelectedMeasurement(index);
                  }}
                  onMouseUp={(e: React.MouseEvent<SVGElement>) => {
                    triggerCameraControlsEnabledEvent(true);

                    const mousePos: [number, number] = getSVGMousePosition(e);

                    setMeasurements(
                      measurements.map((measurement, idx) => {
                        if (idx === index) {
                          return {
                            ...measurement,
                            position: mousePos,
                          };
                        } else {
                          return measurement;
                        }
                      })
                    );

                    triggerDroppedMeasurementEvent();

                    dragRef.current = null;
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

  return <Measurements />;
}

export default ScreenMeasurementTools;
