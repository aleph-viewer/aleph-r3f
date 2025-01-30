import { CameraModeSelector } from './camera-mode-selector';
import { RecenterButton } from './recenter-button';
import { TabSection } from "./tab-section";

export function DisplayControls() {
  return (
    <TabSection className="mt-4 pt-4">
      <CameraModeSelector />
      <RecenterButton />
    </TabSection>
  );
}