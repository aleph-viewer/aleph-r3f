import useStore from '@/Store';
import { AmbientLightSelector } from './ambient-light-selector';
import { RotationAxesSelector } from './rotation-axes-selector';
import { Tab } from './tab';
import { EnvironmentMapSelector } from './environment-map-selector';
import { SceneControlsSelector } from './scene-controls-selector';
import { CameraModeSelector } from './camera-mode-selector';

function SceneTab() {
  const {
    sceneControlsEnabled,
  } = useStore();

  return (
    <Tab>
      <CameraModeSelector />
      <EnvironmentMapSelector />
      <AmbientLightSelector />
      <SceneControlsSelector />
      { sceneControlsEnabled && <RotationAxesSelector /> }
    </Tab>
  );
}

export default SceneTab;
