# Aleph

Aleph is a React/[react-three-fiber](https://github.com/pmndrs/react-three-fiber) 3D viewer for cultural heritage and scientific imaging data, including meshes, 2D images embedded in 3D space, and CT/MRI volumes, with built-in tools for annotation, measurement, and camera/lighting configuration.

**[Live demo](https://aleph-viewer.github.io/aleph-r3f/)**

## Features

- **3D meshes**: load a single glTF/GLB model or a collection of them in one scene, with independent position, rotation, and scale per object.
- **2D images in 3D**: place a flat, texture-mapped image plane at arbitrary corner points within a 3D scene, for pairing photographs or scans alongside 3D geometry.
- **CT/MRI volume rendering**: load multi-frame DICOM data directly and view it as orthogonal slice planes (with interactive window/level contrast controls), an isosurface, or a maximum intensity projection (MIP), with draggable in-viewport handles for repositioning slices.
- **Annotations**: place, edit, drag-to-reposition, and delete annotations on any surface, including a captured camera position so revisiting an annotation restores the original framing. Descriptions support rich text.
- **Measurements**: take linear and angular measurements directly on 3D geometry, or 2D measurements in screen space.
- **Configurable cameras**: perspective or orthographic, with per-scene position, target, field of view, and clipping planes, plus optional interaction constraints (e.g. locked or hemisphere-only orbiting).
- **Lighting and environment**: adjustable ambient light and environment map presets for reflections and ambient illumination.

Aleph also ships as an extension to [Universal Viewer](https://universalviewer.io/), so it can be used as a 3D/volume viewer using [IIIF](https://iiif.io/) Presentation API version 4.

## Installation

After cloning repository files:

```bash
npm install
```

## Usage

```bash
npm run dev
```

This will start the demo app at http://localhost:3000 where you can try out Aleph.

## Development

```bash
git clone git@github.com:aleph-viewer/aleph-r3f.git
cd aleph-r3f
npm install
npm run dev    # start the demo app at localhost:3000
npm run build  # build the library
npm run lint   # lint the codebase
```

### Including Aleph in Other Projects

```tsx
import { Viewer } from 'aleph-r3f';

function App() {
  return (
    <Viewer
      src="https://example.com/model.glb"
      environmentMap="apartment"
    />
  );
}
```

`Viewer` also accepts `srcCollections` for switching between multiple models/scenes, `initialCameraConfig` for camera setup, and more: see the type definitions exported from the package for the full API.

## License

MIT
