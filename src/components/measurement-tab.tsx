import { MeasurementModeSelector } from './measurement-mode-selector';
import { MeasurementUnitsSelector } from './measurement-units-selector';
import { Tab } from './tab';
import { Instructions } from './instructions';
import { useEffect } from 'react';
import useStore from '@/Store';
import { CameraModeSelector } from './camera-mode-selector';

function MeasurementTab() {
  const { measurementMode, setCameraMode, srcs, volumeRenderMode } = useStore();

  useEffect(() => {
    if (measurementMode === 'screen') setCameraMode('orthographic');
  }, []);

  const volumePlacementRestricted = srcs.some((src) => src.type === 'volume') && volumeRenderMode !== 'slices';

  return (
    <Tab>
      {measurementMode === 'object' && volumePlacementRestricted ? (
        <Instructions>
          For volumes, measurement placement isn't available in isosurface or MIP mode. Switch to Slices to place or move measurements. Existing measurements can still be viewed or deleted.
        </Instructions>
      ) : (
        <Instructions>Double-click to create measurements.</Instructions>
      )}
      <MeasurementModeSelector />
      <MeasurementUnitsSelector />
      <CameraModeSelector />
    </Tab>
  );
}

export default MeasurementTab;
