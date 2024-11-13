import { CameraModeSelector } from './camera-mode-selector';
import { OrientationSelector } from './orientation-selector';
import { RecenterButton } from './recenter-button';
import { TabSection } from "./tab-section";
import { UpVectorSelector } from './upvector-selector';

export function DisplayControls() {
  return (
    <TabSection className="mt-4 pt-4">
      <OrientationSelector />
      <UpVectorSelector />
      <CameraModeSelector />
      <RecenterButton />
    </TabSection>
  );
}