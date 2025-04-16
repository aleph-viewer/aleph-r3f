import { Src, SrcObj } from '@/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Box3, Matrix4, Object3D, Sphere, Vector3, Camera, Intersection, Object3DEventMap, Scene, Vector2, Raycaster } from 'three';
import { Size } from '@react-three/fiber';

// if a dot product is less than this, then the normal is facing away from the camera
const DOT_PRODUCT_THRESHOLD = Math.PI * -0.1;

const box = new Box3();
const sphere = new Sphere();
const v1 = new Vector3();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Apply inverse of a matrix to a vector, e.g. for reversing rotation
export function applyMatrix4Inverse(v: Vector3, m: Matrix4) {
  return v.clone().applyMatrix4(m.clone().invert());
}

export function areObjectsIdentical(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function getBoundingSphere(object: Object3D) {
  return box.setFromObject(object).getBoundingSphere(sphere);
}

export function normalizeSrc(src: Src): SrcObj[] {
  const srcs: SrcObj[] = [];

  if (typeof src === 'string') {
    srcs.push({
      url: src as string,
    });
  } else if (Array.isArray(src)) {
    // if it's an array, then it's already a ModelSrc object
    srcs.push(...(src as SrcObj[]));
  } else {
    // if it's not a string or an array, then it's a single ModelSrc object
    srcs.push(src as SrcObj);
  }

  return srcs;
}

export const copyText = (text: string) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
};

export const downloadJsonFile = (json: string) => {
  const fileName = "aleph_annotations.json";
  const data = new Blob([json], { type: "text/json" });
  const jsonURL = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  document.body.appendChild(link);
  link.href = jsonURL;
  link.setAttribute("download", fileName);
  link.click();
  document.body.removeChild(link);
}

export const parseAnnotations = (value: any) => {
  console.log(value);
  value.map((anno: any) => {
    if (anno.position) {
      anno.position = new Vector3().fromArray(Object.values(anno.position));
    }

    if (anno.normal) {
      anno.normal = new Vector3().fromArray(Object.values(anno.normal));
    }

    if (anno.cameraPosition) {
      anno.cameraPosition = new Vector3().fromArray(Object.values(anno.cameraPosition));
    }
    
    if (anno.cameraTarget) {
      anno.cameraTarget = new Vector3().fromArray(Object.values(anno.cameraTarget));
    }

    return anno;
  }).filter((anno: any) => {
    // Remove any annotations that don't have a position
    if (!anno.position) {
      console.warn("Annotation without position:", anno);
      return false;
    }
  });

  return value;
};

// Translate XYZ coordinates to 2D SVG screen position, projecting camera view
// https://github.com/pmndrs/drei/blob/master/src/web/Html.tsx#L25
export function calculateScreenPosition(
  position: Vector3, 
  rotationMatrixRef: React.MutableRefObject<Matrix4>, 
  camera: Camera, 
  size: Size
) { 
  const objectPos = v1.copy(position).applyMatrix4(rotationMatrixRef.current);
  objectPos.project(camera);
  const widthHalf = size.width / 2;
  const heightHalf = size.height / 2;
  return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf];
}

// Get the intersection of the pointer with the scene
export function getIntersects(
  scene: Scene,
  camera: Camera,
  pointer: Vector2,
  raycaster: Raycaster
): Intersection<Object3D<Object3DEventMap>>[] {
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(scene.children, true);
}

export function getIntersectsPoints(
  scene: Scene,
  point1: Vector3,
  point2: Vector3,
  raycaster: Raycaster
): Intersection<Object3D<Object3DEventMap>>[] {
  const direction = point2.clone().sub(point1).normalize();
  raycaster.set(point1, direction);
  return raycaster.intersectObjects(scene.children, true);
}

// Does the vector face the camera?
export function isFacingCamera(
  position: Vector3,
  normal: Vector3,
  camera: Camera,
  rotationMatrixRef: React.MutableRefObject<Matrix4>
): boolean {
  if (!position || !normal || !camera) return false;

  const cameraDirection: Vector3 = camera.position.clone().normalize().sub(
    position.clone().normalize().applyMatrix4(rotationMatrixRef.current)
  );
  const dotProduct: number = cameraDirection.dot(normal.clone().applyMatrix4(rotationMatrixRef.current));

  if (dotProduct < DOT_PRODUCT_THRESHOLD) {
    return false;
  }

  return true;
}

export function getElementTranslate(el: HTMLElement): number[] | null {
  let x: number;
  let y: number;

  const transformValue = el.getAttribute('transform');
  let translateValues: string[] | null = null;

  if (transformValue) {
    const match = transformValue.match(/translate\(([^)]+)\)/);
    if (match) {
      translateValues = match[1].split(', ');
    }
  }

  if (translateValues) {
    x = Number(translateValues[0]);
    y = Number(translateValues[1]);

    return [x, y];
  }

  return null;
}

export function setElementTranslate(el: HTMLElement, x: number, y: number) {
  el?.setAttribute('transform', `translate(${x}, ${y})`);
}
