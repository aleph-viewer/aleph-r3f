'use client';

import useStore from '@/Store';
import { OptionSelector } from './option-selector';
import { PresetsType } from '@react-three/drei/helpers/environment-assets';

export function EnvironmentMapSelector() {
  const { environmentMap, setEnvironmentMap } = useStore();
 
  const handleChange = (value: string) => {
    setEnvironmentMap(value as PresetsType);
  };

  return (
    <OptionSelector
      label="Environment Lighting"
      description="Set the environment lighting type."
      value={environmentMap}
      onChange={handleChange}
      options={[
        { value: 'apartment', label: 'Apartment' },
        { value: 'city', label: 'City' },
        { value: 'dawn', label: 'Dawn' },
        { value: 'forest', label: 'Forest' },
        { value: 'lobby', label: 'Lobby' },
        { value: 'night', label: 'Night' },
        { value: 'park', label: 'Park' },
        { value: 'studio', label: 'Studio' },
        { value: 'sunset', label: 'Sunset' },
        { value: 'warehouse', label: 'Warehouse' },
      ]}
    />
  );
}
