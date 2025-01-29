'use client';

import useStore from '@/Store';
import { BooleanSelector } from './boolean-selector';

export function SceneControlsSelector() {
  const { sceneControlsEnabled, setSceneControlsEnabled } = useStore();

  return (
    <BooleanSelector
      label="Scene Controls"
      description="Show or hide advanced scene controls for rotation and lighting."
      value={sceneControlsEnabled}
      onChange={setSceneControlsEnabled}
    />
  );
}
