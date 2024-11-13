import { DisplayControls } from "./display-controls";
import { TabSection } from "./tab-section";

export function Tab({ children }: { children: React.ReactNode }) {
  return (
    <div className="tab-scroll flex flex-col gap-y-4 text-sm p-4">
      <div className="flex flex-col justify-between grow">
        <TabSection className='grow'>
          {children}
        </TabSection>
        <DisplayControls />
      </div>
    </div>
  );
}
