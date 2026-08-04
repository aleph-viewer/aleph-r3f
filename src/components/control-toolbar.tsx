import { useState } from 'react';
import { useEventTrigger } from '@/lib/hooks/use-event';

import { Box, Eye, Layers, Mountain, ScanLine, SlidersHorizontal } from 'lucide-react';

import { buttonVariants } from './ui/button';
import { Toolbar, Button, Separator } from './ui/toolbar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import useStore from '@/Store';
import { CAMERA_CONTROLS_ENABLED, DRAGGING_VOLUME_HANDLE, DROPPED_VOLUME_HANDLE, RECENTER } from '@/types';
import { VolumeRenderMode } from '@/types/Volume';
import { cn } from '@/lib/utils';
import { Tooltip } from './ui/tooltip';

const VOLUME_MODE_ORDER: VolumeRenderMode[] = ['slices', 'isosurface', 'mip'];

const VOLUME_MODE_ICON: { [key in VolumeRenderMode]: React.ReactNode } = {
  slices: <Layers />,
  isosurface: <Mountain />,
  mip: <ScanLine />,
};

const VOLUME_MODE_LABEL: { [key in VolumeRenderMode]: string } = {
  slices: 'Slices',
  isosurface: 'Isosurface',
  mip: 'MIP',
};

const toolbarButtonClass = cn(buttonVariants({ variant: 'ghost', size: 'iconSm', className: 'text-white' }));

function SliderRow({
  label,
  description,
  value,
  max,
  onChange,
  onDragStart,
  onDragEnd,
}: {
  label: string;
  description: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-gray-400 font-mono">{value}</span>
      </div>
      <div className="text-xs text-gray-400">{description}</div>
      <Slider
        min={0}
        max={max}
        step={1}
        value={[value]}
        onPointerDown={onDragStart}
        onValueChange={(v: number[]) => onChange(v[0])}
        onValueCommit={onDragEnd}
        aria-label={label}
      />
    </div>
  );
}

function DisplayOptionRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

export function ControlToolbar() {
  const {
    axesEnabled,
    boundsEnabled,
    gridEnabled,
    mode,
    setAxesEnabled,
    setBoundsEnabled,
    setGridEnabled,
    srcs,
    volumeRenderMode,
    setVolumeRenderMode,
    volumeIsovalue,
    setVolumeIsovalue,
    volumeSliceXEnabled,
    volumeSliceYEnabled,
    volumeSliceZEnabled,
    setVolumeSliceXEnabled,
    setVolumeSliceYEnabled,
    setVolumeSliceZEnabled,
    volumeWindowCenter,
    volumeWindowWidth,
    setVolumeWindowCenter,
    setVolumeWindowWidth,
  } = useStore();

  const hasVolumeSrc = srcs.some((src) => src.type === 'volume');
  const triggerRecenterEvent = useEventTrigger(RECENTER);
  const triggerDragging = useEventTrigger(DRAGGING_VOLUME_HANDLE);
  const triggerDropped = useEventTrigger(DROPPED_VOLUME_HANDLE);
  const triggerCameraControlsEnabled = useEventTrigger(CAMERA_CONTROLS_ENABLED);

  const isIsosurface = volumeRenderMode === 'isosurface';
  const secondaryLabel = isIsosurface ? 'Isovalue' : 'Slice Controls';

  // Suppresses the hover tooltip while its popover is open — otherwise re-hovering the trigger
  // (e.g. after a click) shows the tooltip underneath the still-open popover.
  const [displayOptionsOpen, setDisplayOptionsOpen] = useState(false);
  const [volumePopoverOpen, setVolumePopoverOpen] = useState(false);

  function cycleVolumeMode() {
    const nextIndex = (VOLUME_MODE_ORDER.indexOf(volumeRenderMode) + 1) % VOLUME_MODE_ORDER.length;
    setVolumeRenderMode(VOLUME_MODE_ORDER[nextIndex]);
  }

  return (
      <div id="scene-toolbar" className="absolute top-5 right-5" style={{ zIndex: 51 }}>
        <Toolbar orientation="vertical" className="control-component" style={{ borderRadius: '0.5rem' }}>
          <div className="grid gap-1">
            <Popover open={displayOptionsOpen} onOpenChange={setDisplayOptionsOpen}>
              <Tooltip content="Display Options" side="left" open={displayOptionsOpen ? false : undefined}>
                <PopoverTrigger asChild>
                  <Button className={toolbarButtonClass}>
                    <span className="sr-only">Display Options</span>
                    <Box />
                  </Button>
                </PopoverTrigger>
              </Tooltip>
              <PopoverContent side="left" align="start" className="w-64 flex flex-col gap-4 p-4">
                <DisplayOptionRow
                  label="Scale and Bounds"
                  description="Show the bounding box and its real-world dimensions."
                  checked={boundsEnabled}
                  onCheckedChange={setBoundsEnabled}
                  disabled={mode !== 'scene'}
                />
                <DisplayOptionRow
                  label="Grid"
                  description="Show a reference grid beneath the scene."
                  checked={gridEnabled}
                  onCheckedChange={setGridEnabled}
                  disabled={mode !== 'scene'}
                />
                <DisplayOptionRow
                  label="Axes"
                  description="Show 3D axis indicators."
                  checked={axesEnabled}
                  onCheckedChange={setAxesEnabled}
                  disabled={mode !== 'scene'}
                />
              </PopoverContent>
            </Popover>

            <Tooltip content="Recenter" side="left">
              <Button className={toolbarButtonClass}
                onClick={() => {
                  triggerRecenterEvent();
                }}
              >
                <span className="sr-only">Recenter</span>
                <Eye />
              </Button>
            </Tooltip>
          </div>

          {hasVolumeSrc && (
            <>
              <Separator className="h-px mt-2 mb-2 bg-accent" />
              <div className="grid gap-1">
                <Tooltip content={`Volume Mode: ${VOLUME_MODE_LABEL[volumeRenderMode]}`} side="left">
                  <Button className={toolbarButtonClass} onClick={cycleVolumeMode}>
                    <span className="sr-only">Volume Mode: {VOLUME_MODE_LABEL[volumeRenderMode]}</span>
                    {VOLUME_MODE_ICON[volumeRenderMode]}
                  </Button>
                </Tooltip>

                <Popover open={volumePopoverOpen} onOpenChange={setVolumePopoverOpen}>
                  <Tooltip content={secondaryLabel} side="left" open={volumePopoverOpen ? false : undefined}>
                    <PopoverTrigger asChild>
                      <Button className={toolbarButtonClass} disabled={volumeRenderMode === 'mip'}>
                        <span className="sr-only">{secondaryLabel}</span>
                        <SlidersHorizontal />
                      </Button>
                    </PopoverTrigger>
                  </Tooltip>
                  {isIsosurface ? (
                    <PopoverContent
                      side="left"
                      align="start"
                      className="w-auto flex flex-col items-center gap-2 p-3"
                    >
                      <span className="text-[10px] tracking-widest text-gray-400">ISOVALUE</span>
                      <Slider
                        orientation="vertical"
                        style={{ height: 100 }}
                        min={0}
                        max={255}
                        step={1}
                        value={[volumeIsovalue]}
                        onPointerDown={() => {
                          triggerCameraControlsEnabled(false);
                          triggerDragging();
                        }}
                        onValueChange={(value: number[]) => setVolumeIsovalue(value[0])}
                        onValueCommit={() => {
                          triggerCameraControlsEnabled(true);
                          triggerDropped();
                        }}
                        aria-label="Isovalue"
                      />
                      <span className="text-sm font-semibold">{volumeIsovalue}</span>
                    </PopoverContent>
                  ) : (
                    <PopoverContent side="left" align="start" className="w-64 flex flex-col gap-4 p-4">
                      <DisplayOptionRow
                        label="X Slice"
                        description="Show the cross-section slice along the X axis."
                        checked={volumeSliceXEnabled}
                        onCheckedChange={setVolumeSliceXEnabled}
                      />
                      <DisplayOptionRow
                        label="Y Slice"
                        description="Show the cross-section slice along the Y axis."
                        checked={volumeSliceYEnabled}
                        onCheckedChange={setVolumeSliceYEnabled}
                      />
                      <DisplayOptionRow
                        label="Z Slice"
                        description="Show the cross-section slice along the Z axis."
                        checked={volumeSliceZEnabled}
                        onCheckedChange={setVolumeSliceZEnabled}
                      />
                      <SliderRow
                        label="Window Center"
                        description="Midpoint of the visible contrast range."
                        value={volumeWindowCenter}
                        max={255}
                        onChange={setVolumeWindowCenter}
                        onDragStart={() => {
                          triggerCameraControlsEnabled(false);
                          triggerDragging();
                        }}
                        onDragEnd={() => {
                          triggerCameraControlsEnabled(true);
                          triggerDropped();
                        }}
                      />
                      <SliderRow
                        label="Window Width"
                        description="Span of the visible contrast range."
                        value={volumeWindowWidth}
                        max={510}
                        onChange={setVolumeWindowWidth}
                        onDragStart={() => {
                          triggerCameraControlsEnabled(false);
                          triggerDragging();
                        }}
                        onDragEnd={() => {
                          triggerCameraControlsEnabled(true);
                          triggerDropped();
                        }}
                      />
                    </PopoverContent>
                  )}
                </Popover>
              </div>
            </>
          )}
        </Toolbar>
      </div>
  );
}
