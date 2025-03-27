'use client';

import useStore from '@/Store';
import { OptionSelector } from './option-selector';
import { normalizeSrc, parseAnnotations } from '@/lib/utils';
import { Annotation } from '@/types';

export function SourceSelector() {
  const { 
    srcCollections, 
    srcCollectionSelected, 
    setAnnotations,
    setAxesEnabled,
    setBoundsEnabled,
    setGridEnabled,
    setSrcs, 
    setSrcCollectionSelected 
  } = useStore();
 
  const handleChange = (value: string) => {
    setSrcCollectionSelected(parseInt(value));

    // Disable axes, bounds, and grid
    setAxesEnabled(false);
    setBoundsEnabled(false);
    setGridEnabled(false);

    const normalizedSrc = normalizeSrc(srcCollections[parseInt(value)].src);
    const srcAnnotations = parseAnnotations(normalizedSrc.reduce(
      (acc: Annotation[], src) => { return acc.concat(src.annotations || []) }, 
      []
    ));
    setSrcs(normalizedSrc);
    setAnnotations(srcAnnotations && srcAnnotations.length ? srcAnnotations : []); 

    setSrcs(normalizeSrc(srcCollections[parseInt(value)].src)); 
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
