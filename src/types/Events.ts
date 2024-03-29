export const ANNO_CLICK = 'alannoclick';
export const CAMERA_UPDATE = 'alcameraupdate';
export const DBL_CLICK = 'aldblclick';
export const DRAGGING_MEASUREMENT = 'aldraggingmeasurement';
export const DROPPED_MEASUREMENT = 'aldraggedmeasurement';
export const RECENTER = 'alrecenter';

export type Event =
  | typeof ANNO_CLICK
  | typeof CAMERA_UPDATE
  | typeof DBL_CLICK
  | typeof DRAGGING_MEASUREMENT
  | typeof DROPPED_MEASUREMENT
  | typeof RECENTER;
