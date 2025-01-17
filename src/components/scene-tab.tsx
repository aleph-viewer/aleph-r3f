import useStore from '@/Store';
import { AmbientLightSelector } from './ambient-light-selector';
import { AxesSelector } from './axes-selector';
import { BoundsSelector } from './bounds-selector';
import { GridSelector } from './grid-selector';
import { RotationAxesSelector } from './rotation-axes-selector';
import { RotationControlsSelector } from './rotation-controls-selector';
import { Tab } from './tab';

function SceneTab() {
  const {
    rotationControlsEnabled,
  } = useStore();

  return (
    <Tab>
      <BoundsSelector />
      <GridSelector />
      <AxesSelector />
      <RotationControlsSelector />
      { rotationControlsEnabled && <RotationAxesSelector /> }
      <AmbientLightSelector />
    </Tab>
  );
}

export default SceneTab;
