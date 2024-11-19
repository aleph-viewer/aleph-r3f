import './App.css';
import { useEffect, useRef } from 'react';
import { useControls } from 'leva';
import { normalizeSrc, ViewerRef, SrcObj, Viewer, ControlPanel } from '../index';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
// @ts-ignore
import DOMPurify from 'dompurify';

function App() {
  const viewerRef = useRef<ViewerRef>(null);
  const loadedUrlsRef = useRef<string[]>([]);

  // https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/Models-showcase.md
  // https://github.com/google/model-viewer/tree/master/packages/modelviewer.dev/assets
  const [{ src }, _setLevaControls] = useControls(() => ({
    src: {
      options: {
        // 'Measurement Cube': {
        //   url: 'https://cdn.glitch.global/afd88411-0206-477e-b65f-3d1f201de994/measurement_cube.glb?v=1710500461208',
        //   label: 'Measurement Cube',
        // },
        'Flight Helmet':
          'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/FlightHelmet/glTF/FlightHelmet.gltf',
        'Roberto Clemente Batting Helmet':
          'https://cdn.glitch.global/2658666b-2aa1-4395-8dfe-44a4aaaa0b16/nmah-1981_0706_06-clemente_helmet-100k-2048_std_draco.glb?v=1729600102458',
        Shoe: {
          url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
          requiredStatement:
            '© 2021, Shopify. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0 International</a> <br/> - Shopify for Everthing',
        },
        'Mosquito in Amber': {
          url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/MosquitoInAmber/glTF-Binary/MosquitoInAmber.glb',
          requiredStatement:
            '© 2018, Sketchfab. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0 International</a> <br/> - Loic Norgeot for Model <br/> - Sketchfab for Real-time refraction',
        },
        'Thor and the Midgard Serpent': {
          url: 'https://modelviewer.dev/assets/SketchfabModels/ThorAndTheMidgardSerpent.glb',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          requiredStatement:
            '© 2019, <a href="https://sketchfab.com/MrTheRich">Mr. The Rich</a>. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0 International</a>',
        } as SrcObj,
        'Multiple Objects': [
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
        // 'Frog (Draco) URL': 'https://aleph-gltf-models.netlify.app/Frog.glb',
      },
    },
    // Recenter: button((_get) => {
    //   viewerRef.current?.recenter();
    // }),
  }));

  // src changed
  useEffect(() => {
    const normalizedSrc = normalizeSrc(src);
    // if the src is already loaded, recenter the camera
    if (normalizedSrc.every((src) => loadedUrlsRef.current.includes(src.url))) {
      setTimeout(() => {
        viewerRef.current?.recenter();
      }, 100);
    }
  }, [src]);

  return (
    <div id="container">
      <div id="control-panel" className="block md:hidden">
        <ControlPanel></ControlPanel>
      </div>
      <div id="viewer">
        <Viewer
          ref={viewerRef}
          envPreset='apartment'
          src={src}
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
      <Toaster />
    </div>
  );
}

export default App;
