'use client';

import useStore from '@/Store';
import { OptionSelector } from './option-selector';
import { normalizeSrc, parseAnnotations } from '@/lib/utils';
import { SrcAnnotation } from '@/types';

export function SourceSelector() {
  const {
    srcCollections,
    srcCollectionSelected,
    setAnnotations,
    setAxesEnabled,
    setBoundsEnabled,
    setCameraMode,
    setCollectionCameraConfig,
    setGridEnabled,
    setObjectMeasurements,
    setScreenMeasurements,
    setSrcs,
    setSrcCollectionSelected
  } = useStore();

  const handleChange = (value: string) => {
    const idx = parseInt(value);
    setSrcCollectionSelected(idx);

    // Disable axes, bounds, and grid
    setAxesEnabled(false);
    setBoundsEnabled(false);
    setGridEnabled(false);

    // Apply per-collection camera config if present
    const camConfig = srcCollections[idx].initialCameraConfig ?? null;
    setCollectionCameraConfig(camConfig);
    setCameraMode(camConfig?.cameraType === 'orthographic' ? 'orthographic' : 'perspective');

    const normalizedSrc = normalizeSrc(srcCollections[idx].src);
    const srcAnnotations = parseAnnotations(normalizedSrc.reduce(
      (acc: SrcAnnotation[], src) => { return acc.concat(src.annotations || []) },
      []
    ));
    setSrcs(normalizedSrc);
    setAnnotations(srcAnnotations && srcAnnotations.length ? srcAnnotations : []);

    // Measurements are session-generated, not tied to a src, so they don't get replaced by
    // switching sources the way annotations do above — clear them explicitly instead.
    setObjectMeasurements([]);
    setScreenMeasurements([]);
  };

  return (
    <OptionSelector
      label="Scene Source"
      description="Select model or collection of models to load."
      value={`${srcCollectionSelected}`}
      onChange={handleChange}
      options={srcCollections.map((collection, idx) => ({ value: `${idx}`, label: collection.label, }))}
    />
  );
}
