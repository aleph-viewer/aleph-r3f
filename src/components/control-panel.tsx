import React, { useState } from 'react';
import { Annotation } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MapPin, Settings } from 'lucide-react';
import { AmbientLightSelector } from './ambient-light-selector';
import useStore from '@/Store';
import { BoundsSelector } from './bounds-selector';
import { DragControls, useMotionValue, Reorder, useDragControls } from 'framer-motion';
import { useRaisedShadow } from '@/lib/hooks/use-raised-shadow';
import clsx from 'clsx';

export function ControlPanel() {
  const { setAnnotateOnDoubleClickEnabled } = useStore();

  return (
    <div className="p-4">
      <Tabs
        defaultValue="scene"
        onValueChange={(tab: string) => {
          switch (tab) {
            case 'scene':
              setAnnotateOnDoubleClickEnabled(false);
              break;
            case 'annotations':
              setAnnotateOnDoubleClickEnabled(true);
              break;
          }
        }}>
        <TabsList className="grid w-full grid-cols-2 gap-2">
          <TabsTrigger value="scene">
            <span className="sr-only">Scene</span>
            <Settings />
          </TabsTrigger>
          <TabsTrigger value="annotations">
            <span className="sr-only">Annotations</span>
            <MapPin />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scene">
          <SceneTab />
        </TabsContent>
        <TabsContent value="annotations">
          <AnnotationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SceneTab() {
  return (
    <div>
      {/* <button className="text-white bg-blue-500 px-2 py-1" onClick={onHome}>
          Home
        </button> */}
      <BoundsSelector />
      <AmbientLightSelector />
    </div>
  );
}

interface Props {
  dragControls: DragControls;
}

export function ReorderIcon({ dragControls }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      onPointerDown={(event) => dragControls.start(event)}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-grip text-gray-400 cursor-grab">
      <circle cx="12" cy="5" r="1" />
      <circle cx="19" cy="5" r="1" />
      <circle cx="5" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
      <circle cx="19" cy="19" r="1" />
      <circle cx="5" cy="19" r="1" />
    </svg>
  );
}

interface ItemProps {
  item: string;
}

export const Item = ({ item }: ItemProps) => {
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const dragControls = useDragControls();

  const classes = clsx('flex justify-between items-center text-white select-none p-2 shrink-0');

  return (
    <Reorder.Item
      value={item}
      id={item}
      style={{ boxShadow, y }}
      className={classes}
      dragListener={false}
      dragControls={dragControls}>
      <span>{item}</span>
      <ReorderIcon dragControls={dragControls} />
    </Reorder.Item>
  );
};

const initialItems = ['🍅 Tomato', '🥒 Cucumber', '🧀 Cheese', '🥬 Lettuce'];

function AnnotationsTab() {
  // const { annotations, setAnnotations } = useStore();

  const [items, setItems] = useState(initialItems);

  return (
    <></>
    // <Reorder.Group axis="y" onReorder={setItems} values={items}>
    //   {items.map((item) => (
    //     <Item key={item} item={item} />
    //   ))}
    // </Reorder.Group>
  );
}

// function AnnotationsTab() {
//   const initialItems = ['🍅 Tomato', '🥒 Cucumber', '🧀 Cheese', '🥬 Lettuce'];

//   const [items, setItems] = useState(initialItems);

//   return (
//     <Reorder.Group axis="y" onReorder={setItems} values={items}>
//       {items.map((item) => (
//         <Item key={item} item={item} />
//       ))}
//     </Reorder.Group>
//   );
// }
