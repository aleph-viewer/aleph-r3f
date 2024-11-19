export const ANNO_CLICK = 'alannoclick';
export const CAMERA_CONTROLS_ENABLED = 'alcameracontrolsenabled';
export const CAMERA_UPDATE = 'alcameraupdate';
// export const CAMERA_SLEEP = 'alcamerasleep';
export const DBL_CLICK = 'aldblclick';
export const DRAGGING_MEASUREMENT = 'aldraggingmeasurement';
export const DROPPED_MEASUREMENT = 'aldraggedmeasurement';
export const RECENTER = 'alrecenter';
export const RECENTER_INSTANT = 'alrecenterinstant';

export type Event =
  | typeof ANNO_CLICK
  | typeof CAMERA_CONTROLS_ENABLED
  | typeof CAMERA_UPDATE
  // | typeof CAMERA_SLEEP
  | typeof DBL_CLICK
  | typeof DRAGGING_MEASUREMENT
  | typeof DROPPED_MEASUREMENT
  | typeof RECENTER
  | typeof RECENTER_INSTANT;
