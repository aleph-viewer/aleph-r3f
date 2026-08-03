import { useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { useDrag } from '@use-gesture/react';
import { Camera, Group, Mesh, Vector3 } from 'three';
import useStore from '@/Store';
import { CAMERA_CONTROLS_ENABLED, DRAGGING_VOLUME_HANDLE, DROPPED_VOLUME_HANDLE } from '@/types';
import { useEventTrigger } from '@/lib/hooks/use-event';

type Axis = 0 | 1 | 2;

// Mirrors volume-slice-plane.tsx's AXIS_DIMS: which two dimensions each plane spans.
const AXIS_DIMS: { [key in Axis]: { widthDim: Axis; heightDim: Axis } } = {
  0: { widthDim: 1, heightDim: 2 },
  1: { widthDim: 0, heightDim: 2 },
  2: { widthDim: 0, heightDim: 1 },
};

const AXIS_LABEL: { [key in Axis]: string } = { 0: 'X', 1: 'Y', 2: 'Z' };

const HANDLE_EDGE: { [key in Axis]: { widthParam: number; heightParam: number } } = {
  0: { widthParam: 1.08, heightParam: -0.08 },
  1: { widthParam: 1.08, heightParam: -0.08 },
  2: { widthParam: -0.08, heightParam: 1.08 },
};

// A point on (or just past) a slice plane's edge, in the same local volume space volume-slice-plane.tsx uses.
function localPoint(axis: Axis, size: [number, number, number], slicePosition: number, widthParam: number, heightParam: number): Vector3 {
  const { widthDim, heightDim } = AXIS_DIMS[axis];
  const coords: [number, number, number] = [0, 0, 0];
  coords[widthDim] = (widthParam - 0.5) * size[widthDim];
  coords[heightDim] = (heightParam - 0.5) * size[heightDim];
  coords[axis] = (slicePosition - 0.5) * size[axis];
  return new Vector3(...coords);
}

function projectToScreen(worldPos: Vector3, camera: Camera, viewportSize: { width: number; height: number }): [number, number] {
  const p = worldPos.clone().project(camera);
  return [p.x * (viewportSize.width / 2) + viewportSize.width / 2, -(p.y * (viewportSize.height / 2)) + viewportSize.height / 2];
}

type SliceHandleProps = {
  axis: Axis;
  size: [number, number, number];
  position: number;
  setPosition: (value: number) => void;
  anchorRef: React.RefObject<Group>;
  occludeRefs: React.RefObject<Mesh>[];
};

function SliceHandle({ axis, size, position, setPosition, anchorRef, occludeRefs }: SliceHandleProps) {
  const { camera, size: viewportSize } = useThree();
  const triggerDragging = useEventTrigger(DRAGGING_VOLUME_HANDLE);
  const triggerDropped = useEventTrigger(DROPPED_VOLUME_HANDLE);
  const triggerCameraControlsEnabled = useEventTrigger(CAMERA_CONTROLS_ENABLED);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const dragRef = useRef<{ dirX: number; dirY: number; pixelsPerUnit: number; startValue: number } | null>(null);

  const bind = useDrag(({ first, last, movement: [mx, my], event }) => {
    event.stopPropagation();

    if (first) {
      triggerCameraControlsEnabled(false);
      triggerDragging();
      setIsDragging(true);

      const { widthParam, heightParam } = HANDLE_EDGE[axis];
      const a = projectToScreen(anchorRef.current!.localToWorld(localPoint(axis, size, 0.4, widthParam, heightParam)), camera, viewportSize);
      const b = projectToScreen(anchorRef.current!.localToWorld(localPoint(axis, size, 0.6, widthParam, heightParam)), camera, viewportSize);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      dragRef.current = { dirX: dx / len, dirY: dy / len, pixelsPerUnit: len / 0.2, startValue: position };
    }

    if (dragRef.current) {
      const { dirX, dirY, pixelsPerUnit, startValue } = dragRef.current;
      const along = mx * dirX + my * dirY;
      setPosition(Math.min(1, Math.max(0, startValue + along / pixelsPerUnit)));
    }

    if (last) {
      triggerCameraControlsEnabled(true);
      triggerDropped();
      setIsDragging(false);
      dragRef.current = null;
    }
  });

  function handleKeyDown(event: React.KeyboardEvent) {
    const step = event.shiftKey ? 0.1 : 0.01;
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(1, position + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(0, position - step);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setPosition(next);
  }

  const { widthParam, heightParam } = HANDLE_EDGE[axis];

  const handlePos = useMemo(
    () => localPoint(axis, size, position, widthParam, heightParam),
    [axis, size, position, widthParam, heightParam]
  );

  const trackPoints = useMemo(
    () =>
      [
        localPoint(axis, size, 0, widthParam, heightParam),
        localPoint(axis, size, 1, widthParam, heightParam),
      ] as [Vector3, Vector3],
    [axis, size, widthParam, heightParam]
  );

  return (
    <>
      <Line points={trackPoints} color="#9a97a8" lineWidth={1} transparent opacity={0.35} />
      <Html
        position={handlePos}
        zIndexRange={[60, 0]}
        center
        // Scoped to the (at most 3) slice-plane meshes rather than the whole scene — one cheap
        // per-frame raycast against a handful of objects, not a scene-wide occlusion test.
        occlude={occludeRefs.length ? occludeRefs : undefined}
      >
        <div className="volume-handle-anchor">
          <div
            {...bind()}
            className={`volume-handle${isDragging || isFocused ? ' dragging' : ''}`}
            tabIndex={0}
            role="slider"
            aria-label={`${AXIS_LABEL[axis]} slice position`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position * 100)}
            aria-valuetext={`${Math.round(position * 100)}%`}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {isDragging || isFocused ? (
            <div className="volume-handle-readout">
              {AXIS_LABEL[axis]} · {Math.round(position * 100)}%
            </div>
          ) : (
            <span className="volume-handle-label">{AXIS_LABEL[axis]}</span>
          )}
        </div>
      </Html>
    </>
  );
}

export function VolumeSliceHandles({
  size,
  occludeRefs,
}: {
  size: [number, number, number];
  occludeRefs: React.RefObject<Mesh>[];
}) {
  const anchorRef = useRef<Group>(null!);
  const {
    volumeSliceXEnabled,
    volumeSliceYEnabled,
    volumeSliceZEnabled,
    volumeSliceXPosition,
    volumeSliceYPosition,
    volumeSliceZPosition,
    setVolumeSliceXPosition,
    setVolumeSliceYPosition,
    setVolumeSliceZPosition,
  } = useStore();

  const handles: { axis: Axis; enabled: boolean; position: number; setPosition: (value: number) => void }[] = [
    { axis: 0, enabled: volumeSliceXEnabled, position: volumeSliceXPosition, setPosition: setVolumeSliceXPosition },
    { axis: 1, enabled: volumeSliceYEnabled, position: volumeSliceYPosition, setPosition: setVolumeSliceYPosition },
    { axis: 2, enabled: volumeSliceZEnabled, position: volumeSliceZPosition, setPosition: setVolumeSliceZPosition },
  ];

  return (
    <group ref={anchorRef}>
      {handles.map(
        ({ axis, enabled, position, setPosition }) =>
          enabled && (
            <SliceHandle
              key={axis}
              axis={axis}
              size={size}
              position={position}
              setPosition={setPosition}
              anchorRef={anchorRef}
              occludeRefs={occludeRefs}
            />
          )
      )}
    </group>
  );
}
