import './App.css';
import { useEffect, useRef } from 'react';
// import { Leva, useControls } from 'leva';
import { ViewerRef, SrcObj, Viewer, ControlPanel } from '../index';
import { toast } from 'sonner';
// @ts-ignore
import DOMPurify from 'dompurify';
import useStore from './Store';
import { PresetsType } from '@react-three/drei/helpers/environment-assets';

function App() {
  const viewerRef = useRef<ViewerRef>(null);
  const loadedUrlsRef = useRef<string[]>([]);

  const { 
    environmentMap, 
    setAmbientLightIntensity, 
    setEnvironmentMap
  } = useStore();

  // Configurable app data, includes list of models and scene/UI presets
  const config = {
    src: 'https://raw.githubusercontent.com/IIIF/3d/main/assets/astronaut/astronaut.glb',
    srcCollections: [
      // 'Measurement Cube': {
      //   url: 'https://cdn.glitch.global/afd88411-0206-477e-b65f-3d1f201de994/measurement_cube.glb?v=1710500461208',
      //   label: 'Measurement Cube',
      // },
      {
        label: 'Flight Helmet',
        src: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/FlightHelmet/glTF/FlightHelmet.gltf',
      },
      {
        label: 'Roberto Clemente Batting Helmet',
        src: 'https://cdn.glitch.global/2658666b-2aa1-4395-8dfe-44a4aaaa0b16/nmah-1981_0706_06-clemente_helmet-100k-2048_std_draco.glb?v=1729600102458',
      },
      {
        label: 'Shoe',
        src: {
          url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
          requiredStatement:
            '© 2021, Shopify. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0 International</a> <br/> - Shopify for Everthing',
        },
      },
      {
        label: 'Mosquito in Amber',
          src: {
          url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/MosquitoInAmber/glTF-Binary/MosquitoInAmber.glb',
          requiredStatement:
            '© 2018, Sketchfab. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0 International</a> <br/> - Loic Norgeot for Model <br/> - Sketchfab for Real-time refraction',
        },
      },
      {
        label: 'Thor and the Midgard Serpent',
        src: {
          url: 'https://modelviewer.dev/assets/SketchfabModels/ThorAndTheMidgardSerpent.glb',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          requiredStatement:
            '© 2019, <a href="https://sketchfab.com/MrTheRich">Mr. The Rich</a>. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0 International</a>',
        } as SrcObj,
      },
      {
        label: 'Multiple Objects',
        src: [
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
        ] as SrcObj[],
      },
      {
        label: 'Stanford Bunny',
        src: 'https://raw.githubusercontent.com/JulieWinchester/aleph-assets/main/bunny.glb',
      },
      {
        label: 'CT Fish Scan',
        src: { url: 'https://raw.githubusercontent.com/JulieWinchester/aleph-assets/main/fish.dcm', type: 'volume' } as SrcObj,
      },
      {
        label: 'Astronaut Annotated',
        src: {
          url: 'https://raw.githubusercontent.com/IIIF/3d/main/assets/astronaut/astronaut.glb',
          annotations: [
            {
              "position": {
                "x": 0.013300441763413414,
                "y": 3.49898729918975,
                "z": 0.7009494188636793
              },
              "normal": {
                "x": 0.2913311155479682,
                "y": -0.19759283797457303,
                "z": 0.9359931898762569
              },
              "cameraPosition": {
                "x": 0,
                "y": 2.010847091674805,
                "z": 9.11616179783789
              },
              "cameraTarget": {
                "x": 0,
                "y": 2.0108470916748047,
                "z": -0.012333005666732798
              },
              "label": "Helmet",
              "description": "Helmet Description"
            },
            {
              "position": {
                "x": 1.0324531718276508,
                "y": 1.7976133376627947,
                "z": 0.2435945547861511
              },
              "normal": {
                "x": 0.6063132429509818,
                "y": 0.04805783885403426,
                "z": 0.7937724456964624
              },
              "cameraPosition": {
                "x": 0,
                "y": 2.010847091674805,
                "z": 9.11616179783789
              },
              "cameraTarget": {
                "x": 0,
                "y": 2.0108470916748047,
                "z": -0.012333005666732798
              },
              "label": "Glove",
              "description": "Glove Description"
            }
          ],
        } as SrcObj,
      },
    ],
    scene: {
      ambientLightIntensity: 0,
      environmentMap: 'apartment',
      rotation: [0, 0, 0], // Default rotation in radians
    }
  };

  useEffect(() => {
    if (config.scene.ambientLightIntensity) setAmbientLightIntensity(config.scene.ambientLightIntensity);
    if (config.scene.environmentMap) setEnvironmentMap(config.scene.environmentMap as PresetsType);
  }, []);

  return (
    <div id="container">
      <div id="control-panel" className="block md:hidden control-component">
        <ControlPanel></ControlPanel>
      </div>
      <div id="viewer">
        <Viewer
          ref={viewerRef}
          // src={config.src} // Uncomment this line and comment srcCollections to load single src
          srcCollections={config.srcCollections}
          environmentMap={environmentMap}
          rotationPreset={config.scene.rotation as [number, number, number]}
          onLoad={(srcs: SrcObj[]) => {
            console.log(`model${srcs.length > 1 ? 's' : ''} loaded`, srcs);
            // add loaded urls to array of already loaded urls
            loadedUrlsRef.current = [...loadedUrlsRef.current, ...srcs.map((src) => src.url)];

            // loop through each src and show the required statement if it exists
            srcs
              .filter((srcObj) => srcObj.requiredStatement)
              .forEach((srcObj) => {
                const sanitizedHTML = DOMPurify.sanitize(srcObj.requiredStatement as string);
                toast(<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />);
              });
          }}
        />
      </div>
    </div>
  );
}

export default App;
