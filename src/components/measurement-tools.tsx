import { Matrix4 } from 'three';
import { ObjectMeasurementTools } from './object-measurement-tools';
import ScreenMeasurementTools from './screen-measurement-tools';
import useStore from '@/Store';

export function MeasurementTools({ pivotMatrixRef }: { pivotMatrixRef: React.MutableRefObject<Matrix4> }) {
  const { measurementMode } = useStore();

  return (
    <>
      {measurementMode === 'object' && <ObjectMeasurementTools pivotMatrixRef={pivotMatrixRef} />}
      {measurementMode === 'screen' && <ScreenMeasurementTools />}
    </>
  );
}

export default MeasurementTools;
