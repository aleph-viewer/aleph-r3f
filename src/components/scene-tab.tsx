import useStore from '@/Store';
import { AmbientLightSelector } from './ambient-light-selector';
import { RotationAxesSelector } from './rotation-axes-selector';
import { Tab } from './tab';
import { EnvironmentMapSelector } from './environment-map-selector';
import { RotationControlsSelector } from './rotation-controls-selector';
import { CameraModeSelector } from './camera-mode-selector';
import { SourceSelector } from './source-selector';
import { VolumeSliceSelector } from './volume-slice-selector';
import { VolumeRenderModeSelector } from './volume-render-mode-selector';
import { VolumeIsovalueSelector } from './volume-isovalue-selector';
import { WindowLevelSelector } from './window-level-selector';

function SceneTab() {
  const {
    srcCollections,
    srcs,
    rotationControlsEnabled,
    volumeRenderMode,
  } = useStore();

  const hasVolumeSrc = srcs.some((src) => src.type === 'volume');

  return (
    <Tab>
      { srcCollections.length > 0 && <SourceSelector /> }
      <CameraModeSelector />
      <EnvironmentMapSelector />
      <AmbientLightSelector />
      <RotationControlsSelector />
      { rotationControlsEnabled && <RotationAxesSelector /> }
      { hasVolumeSrc && <VolumeRenderModeSelector /> }
      { hasVolumeSrc && volumeRenderMode === 'slices' && <VolumeSliceSelector /> }
      { hasVolumeSrc && volumeRenderMode === 'slices' && <WindowLevelSelector /> }
      { hasVolumeSrc && volumeRenderMode === 'isosurface' && <VolumeIsovalueSelector /> }
    </Tab>
  );
}

export default SceneTab;
