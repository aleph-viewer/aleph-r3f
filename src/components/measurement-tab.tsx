import { MeasurementModeSelector } from './measurement-mode-selector';
import { MeasurementUnitsSelector } from './measurement-units-selector';
import { Tab } from './tab';
import { Instructions } from './instructions';
import { useEffect } from 'react';
import useStore from '@/Store';
import { CameraModeSelector } from './camera-mode-selector';

function MeasurementTab() {
  const { measurementMode, setCameraMode } = useStore();

  useEffect(() => {
    if (measurementMode === 'screen') setCameraMode('orthographic');
  }, []);

  return (
    <Tab>
      <Instructions>Double-click to create measurements.</Instructions>
      <MeasurementModeSelector />
      <MeasurementUnitsSelector />
      <CameraModeSelector />
    </Tab>
  );
}

export default MeasurementTab;
