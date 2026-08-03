export const ANNO_CLICK = 'alannoclick';
export const CAMERA_CONTROLS_ENABLED = 'alcameracontrolsenabled';
export const CAMERA_LOADING_DONE = 'alcameraloadingdone';
export const CAMERA_UPDATE = 'alcameraupdate';
// export const CAMERA_SLEEP = 'alcamerasleep';
export const DBL_CLICK = 'aldblclick';
export const DRAGGING_MEASUREMENT = 'aldraggingmeasurement';
export const DROPPED_MEASUREMENT = 'aldraggedmeasurement';
export const JSON_EMIT = 'aljsonemit';
export const JSON_EMIT_REQUEST = 'aljsonemitrequest';
export const RECENTER = 'alrecenter';
export const VOLUME_LOADING_PROGRESS = 'alvolumeloadingprogress';

export type Event =
  | typeof ANNO_CLICK
  | typeof CAMERA_CONTROLS_ENABLED
  | typeof CAMERA_LOADING_DONE
  | typeof CAMERA_UPDATE
  // | typeof CAMERA_SLEEP
  | typeof DBL_CLICK
  | typeof DRAGGING_MEASUREMENT
  | typeof DROPPED_MEASUREMENT
  | typeof JSON_EMIT
  | typeof JSON_EMIT_REQUEST
  | typeof RECENTER
  | typeof VOLUME_LOADING_PROGRESS;
