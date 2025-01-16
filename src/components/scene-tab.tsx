import useStore from '@/Store';
import { AmbientLightSelector } from './ambient-light-selector';
import { AxesSelector } from './axes-selector';
import { BoundsSelector } from './bounds-selector';
import { GridSelector } from './grid-selector';
import { PivotAxesSelector } from './pivot-axes-selector';
import { PivotControlsSelector } from './pivot-controls-selector';
import { Tab } from './tab';

function SceneTab() {
  const {
    pivotControlsEnabled,
  } = useStore();

  return (
    <Tab>
      <BoundsSelector />
      <GridSelector />
      <AxesSelector />
      <PivotControlsSelector />
      { pivotControlsEnabled && <PivotAxesSelector /> }
      <AmbientLightSelector />
    </Tab>
  );
}

export default SceneTab;
