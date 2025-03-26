import useStore from '@/Store';
import { AmbientLightSelector } from './ambient-light-selector';
import { RotationAxesSelector } from './rotation-axes-selector';
import { Tab } from './tab';
import { EnvironmentMapSelector } from './environment-map-selector';
import { RotationControlsSelector } from './rotation-controls-selector';
import { CameraModeSelector } from './camera-mode-selector';
import { SourceSelector } from './source-selector';

function SceneTab() {
  const {
    srcCollections,
    rotationControlsEnabled,
  } = useStore();

  return (
    <Tab>
      { srcCollections.length && <SourceSelector /> }
      <CameraModeSelector />
      <EnvironmentMapSelector />
      <AmbientLightSelector />
      <RotationControlsSelector />
      { rotationControlsEnabled && <RotationAxesSelector /> }
    </Tab>
  );
}

export default SceneTab;
