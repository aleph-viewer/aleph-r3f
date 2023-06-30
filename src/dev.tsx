import React from 'react';
import ReactDOM from 'react-dom/client';
import { Aleph } from './index';
import { useControls } from 'leva';
import { ModelSrc } from './types/ModelSrc';
import { Environment } from './types/Environment';

const Wrapper = () => {
  const [{ src, ambientLightIntensity, grid, axes, boundingBox, environment }, setLevaControls] = useControls(() => ({
    src: {
      options: {
        'Flight Helmet':
          'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/FlightHelmet/glTF/FlightHelmet.gltf',
        Thor: {
          url: 'https://modelviewer.dev/assets/SketchfabModels/ThorAndTheMidgardSerpent.glb',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        } as ModelSrc,
        'Multiple Objects': [
          // {
          //   url: 'https://modelviewer.dev/assets/ShopifyModels/Canoe.glb',
          //   position: [0, 0, 0],
          //   rotation: [0, 0, 0],
          //   scale: [1, 1, 1],
          // },
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
        ] as ModelSrc[],
        'Frog (Draco) URL': 'https://aleph-gltf-models.netlify.app/Frog.glb',
      },
    },
    ambientLightIntensity: {
      value: 0,
      min: 0,
      max: 5,
      step: 0.1,
    },
    grid: { value: false, label: 'grid' },
    axes: { value: false, label: 'axes' },
    boundingBox: { value: false, label: 'bounding box' },
    environment: {
      options: {
        Apartment: 'apartment',
        City: 'city',
        Dawn: 'dawn',
        Forest: 'forest',
        Lobby: 'lobby',
        Night: 'night',
        Park: 'park',
        Studio: 'studio',
        Sunset: 'sunset',
        Warehouse: 'warehouse',
      },
    },
  }));

  return (
    <Aleph
      src={src}
      ambientLightIntensity={ambientLightIntensity}
      onLoad={() => {
        console.log('Aleph loaded');
      }}
      boundingBox={boundingBox}
      grid={grid}
      axes={axes}
      environment={environment as Environment}
    />
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Wrapper />);
