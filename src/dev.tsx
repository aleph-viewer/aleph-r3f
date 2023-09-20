import './globals.css';
import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Viewer } from './index';
import { button, folder, useControls } from 'leva';
import { Src } from './types/Src';
import { Environment } from './types/Environment';
import { ControlPanel } from './components/control-panel';
import { ViewerRef } from './types';

const Wrapper = () => {
  const viewerRef = useRef<ViewerRef>(null);
  const YUP: [number, number, number] = [0, 1, 0];
  const ZUP: [number, number, number] = [0, 0, -1];

  const [upVector, setUpVector] = useState<[number, number, number]>(YUP);

  const srcs: Src[] = [
    'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/FlightHelmet/glTF/FlightHelmet.gltf',
    {
      url: 'https://modelviewer.dev/assets/SketchfabModels/ThorAndTheMidgardSerpent.glb',
      label: 'Thor',
    },
    [
      {
        url: 'https://modelviewer.dev/assets/ShopifyModels/Mixer.glb',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      {
        url: 'https://modelviewer.dev/assets/ShopifyModels/GeoPlanter.glb',
        position: [0.5, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      {
        url: 'https://modelviewer.dev/assets/ShopifyModels/ToyTrain.glb',
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      {
        url: 'https://modelviewer.dev/assets/ShopifyModels/Chair.glb',
        position: [1.5, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    ],
  ];

  // const [
  //   { src, annotation, ambientLightIntensity, arrowHelpers, grid, axes, boundingBox, environment, orthographic },
  //   _setLevaControls,
  // ] = useControls(() => ({
  //   src: {
  //     options: {
  //       'Flight Helmet':
  //         'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/FlightHelmet/glTF/FlightHelmet.gltf',
  //       Thor: {
  //         url: 'https://modelviewer.dev/assets/SketchfabModels/ThorAndTheMidgardSerpent.glb',
  //         position: [0, 0, 0],
  //         rotation: [0, 0, 0],
  //         scale: [1, 1, 1],
  //       } as ModelSrc,
  //       'Multiple Objects': [
  //         // {
  //         //   url: 'https://modelviewer.dev/assets/ShopifyModels/Canoe.glb',
  //         //   position: [0, 0, 0],
  //         //   rotation: [0, 0, 0],
  //         //   scale: [1, 1, 1],
  //         // },
  //         {
  //           url: 'https://modelviewer.dev/assets/ShopifyModels/Mixer.glb',
  //           position: [0, 0, 0],
  //           rotation: [0, 0, 0],
  //           scale: [1, 1, 1],
  //         },
  //         {
  //           url: 'https://modelviewer.dev/assets/ShopifyModels/GeoPlanter.glb',
  //           position: [0.5, 0, 0],
  //           rotation: [0, 0, 0],
  //           scale: [1, 1, 1],
  //         },
  //         {
  //           url: 'https://modelviewer.dev/assets/ShopifyModels/ToyTrain.glb',
  //           position: [1, 0, 0],
  //           rotation: [0, 0, 0],
  //           scale: [1, 1, 1],
  //         },
  //         {
  //           url: 'https://modelviewer.dev/assets/ShopifyModels/Chair.glb',
  //           position: [1.5, 0, 0],
  //           rotation: [0, 0, 0],
  //           scale: [1, 1, 1],
  //         },
  //       ] as ModelSrc[],
  //       'Frog (Draco) URL': 'https://aleph-gltf-models.netlify.app/Frog.glb',
  //     },
  //   },
  //   annotation: { value: false, label: 'annotation' },
  //   ambientLightIntensity: {
  //     value: 0,
  //     min: 0,
  //     max: 5,
  //     step: 0.1,
  //   },
  //   arrowHelpers: { value: false, label: 'arrowHelpers' },
  //   grid: { value: false, label: 'grid' },
  //   axes: { value: false, label: 'axes' },
  //   boundingBox: { value: false, label: 'bounding box' },
  //   environment: {
  //     options: {
  //       Apartment: 'apartment',
  //       City: 'city',
  //       Dawn: 'dawn',
  //       Forest: 'forest',
  //       Lobby: 'lobby',
  //       Night: 'night',
  //       Park: 'park',
  //       Studio: 'studio',
  //       Sunset: 'sunset',
  //       Warehouse: 'warehouse',
  //     },
  //   },
  //   orthographic: { value: false, label: 'orthographic' },
  //   setUpVector: folder(
  //     {
  //       'y-up': button((_get) => setUpVector(YUP)),
  //       'z-up': button((_get) => setUpVector(ZUP)),
  //     },
  //     { collapsed: true }
  //   ),
  //   Home: button((_get) => {
  //     viewerRef.current?.home();
  //   }),
  // }));

  return (
    <div id="container">
      <div id="control-panel">
        <ControlPanel />
      </div>
      <div id="viewer">
        <Viewer
          ref={viewerRef}
          src={srcs[2]}
          // arrowHelpers={arrowHelpers}
          onLoad={() => {
            console.log('model(s) loaded');
          }}
          // grid={grid}
          // axes={axes}
          // environment={environment as Environment}
          // orthographic={orthographic}
          upVector={upVector}
        />
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Wrapper />);
