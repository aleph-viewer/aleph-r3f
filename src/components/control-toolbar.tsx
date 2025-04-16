// import { RecenterButton } from "./recenter-button";
import { useEventTrigger } from '@/lib/hooks/use-event';

import { Axis3d, Box, Grid, Eye } from 'lucide-react';

import { buttonVariants } from './ui/button';
import { Toolbar, Button, ToggleGroup, Separator, ToggleItemTooltip } from "./ui/toolbar";
import useStore from '@/Store';
import { RECENTER } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip } from './ui/tooltip';


export function ControlToolbar() {
  const { 
    axesEnabled,
    boundsEnabled,
    gridEnabled,
    mode,
    setAxesEnabled, 
    setBoundsEnabled, 
    setGridEnabled 
  } = useStore();

  const triggerRecenterEvent = useEventTrigger(RECENTER);

  function toggleValues(): string[] {
    const values = [];
    if (boundsEnabled) values.push('box');
    if (gridEnabled) values.push('grid');
    if (axesEnabled) values.push('axis3d');
    return values;
  }

  return (
      <div id="scene-toolbar" className="absolute top-5 right-5" style={{ zIndex: 51 }}> 
        <Toolbar orientation="vertical" className="control-component" style={{ borderRadius: '0.5rem' }}>
          <ToggleGroup
            className="grid gap-1"
            type="multiple"
            value={toggleValues()}
            onValueChange={(values: string[]) => {
                if (values.includes('box')) {
                  setBoundsEnabled(true);
                } else {
                  setBoundsEnabled(false);
                }

                if (values.includes('grid')) {
                  setGridEnabled(true);
                } else {
                  setGridEnabled(false);
                }

                if (values.includes('axis3d')) {
                  setAxesEnabled(true);
                } else {
                  setAxesEnabled(false);
                }
            }}
          >
            <ToggleItemTooltip value='box' description='Show Bounding Box' tooltipSide='left' disabled={mode !== 'scene'}>
              <Box />
            </ToggleItemTooltip>            
          
            <ToggleItemTooltip value='grid' description='Show Grid' tooltipSide='left' disabled={mode !== 'scene'}>
              <Grid />
            </ToggleItemTooltip>

            <ToggleItemTooltip value='axis3d' description='Show Axes' tooltipSide='left' disabled={mode !== 'scene'}>
              <Axis3d />
            </ToggleItemTooltip>
          </ToggleGroup>
          <Separator className="h-px mt-2 mb-2 bg-accent" />

          <Tooltip content="Recenter" side="left">
            <Button className={cn(buttonVariants({ variant: 'outline', size: 'iconSm', className: 'text-white bg-black' }))}
              onClick={() => {
                triggerRecenterEvent();
              }}
            >
              <span className="sr-only">Recenter</span>
              <Eye />
            </Button>
          </Tooltip>
        </Toolbar>
      </div>
  );
}