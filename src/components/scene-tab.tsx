import useStore from '@/Store';
import { AmbientLightSelector } from './ambient-light-selector';
import { AxesSelector } from './axes-selector';
import { BoundsSelector } from './bounds-selector';
import { GridSelector } from './grid-selector';
import { RotationAxesSelector } from './rotation-axes-selector';
import { RotationControlsSelector } from './rotation-controls-selector';
import { Tab } from './tab';
import { EnvironmentMapSelector } from './environment-map-selector';

function SceneTab() {
  const {
    rotationControlsEnabled,
  } = useStore();

  return (
    <Tab>
      <AxesSelector />
      <BoundsSelector />
      <GridSelector />
      <RotationControlsSelector />
      { rotationControlsEnabled && <RotationAxesSelector /> }
      <AmbientLightSelector />
      <EnvironmentMapSelector />
    </Tab>
  );
}

export default SceneTab;
