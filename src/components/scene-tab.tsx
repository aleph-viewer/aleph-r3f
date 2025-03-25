import useStore from '@/Store';
import { AmbientLightSelector } from './ambient-light-selector';
import { RotationAxesSelector } from './rotation-axes-selector';
import { Tab } from './tab';
import { EnvironmentMapSelector } from './environment-map-selector';
import { RotationControlsSelector } from './rotation-controls-selector';
import { CameraModeSelector } from './camera-mode-selector';

function SceneTab() {
  const {
    rotationControlsEnabled,
  } = useStore();

  return (
    <Tab>
      <CameraModeSelector />
      <EnvironmentMapSelector />
      <AmbientLightSelector />
      <RotationControlsSelector />
      { rotationControlsEnabled && <RotationAxesSelector /> }
    </Tab>
  );
}

export default SceneTab;
