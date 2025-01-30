import { Matrix4 } from 'three';
import { ObjectMeasurementTools } from './object-measurement-tools';
import ScreenMeasurementTools from './screen-measurement-tools';
import useStore from '@/Store';

export function MeasurementTools({ rotationMatrixRef }: { rotationMatrixRef: React.MutableRefObject<Matrix4> }) {
  const { measurementMode } = useStore();

  return (
    <>
      {measurementMode === 'object' && <ObjectMeasurementTools rotationMatrixRef={rotationMatrixRef} />}
      {measurementMode === 'screen' && <ScreenMeasurementTools />}
    </>
  );
}

export default MeasurementTools;
