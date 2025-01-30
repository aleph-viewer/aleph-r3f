import useStore from '@/Store';
import { AmbientLightSelector } from './ambient-light-selector';
import { AxesSelector } from './axes-selector';
import { BoundsSelector } from './bounds-selector';
import { GridSelector } from './grid-selector';
import { RotationAxesSelector } from './rotation-axes-selector';
import { Tab } from './tab';
import { EnvironmentMapSelector } from './environment-map-selector';
import { SceneControlsSelector } from './scene-controls-selector';

function SceneTab() {
  const {
    sceneControlsEnabled,
  } = useStore();

  return (
    <Tab>
      <AxesSelector />
      <BoundsSelector />
      <GridSelector />
      <SceneControlsSelector />
      { sceneControlsEnabled && 
          <div className="flex flex-col gap-y-4 grow">
            <RotationAxesSelector />
            <AmbientLightSelector />
            <EnvironmentMapSelector />
          </div>
      }
    </Tab>
  );
}

export default SceneTab;
