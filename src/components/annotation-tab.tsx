import { FormEvent, useRef, useState } from 'react';
import { Annotation, ANNO_CLICK, CAMERA_UPDATE } from '@/types';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import useKeyDown from '@/lib/hooks/use-key-press';
import { useEventListener, useEventTrigger } from '@/lib/hooks/use-event';
import useStore from '@/Store';
import { Matrix4, Vector3 } from 'three';
import { Tab } from './tab';
import { cn } from '@/lib/utils';
import { Instructions } from './instructions';
import { AnnotationsDialog } from './import-annotations-dialog';
import { Check, Pencil, View, X } from 'lucide-react';

function AnnotationTab() {
  const { annotations, setAnnotations, selectedAnnotation, setSelectedAnnotation } = useStore();

  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [label, setLabel] = useState<string | undefined>();
  const [description, setDescription] = useState<string | undefined>();

  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  const cameraPositionRef = useRef<Vector3>();
  const cameraTargetRef = useRef<Vector3>();
  const pivotMatrixRef = useRef<Matrix4>(new Matrix4());

  useKeyDown('Escape', () => {
    setEditIdx(null);
  });

  const handleCameraUpdateEvent = (e: any) => {
    cameraPositionRef.current = e.detail.cameraPosition;
    cameraTargetRef.current = e.detail.cameraTarget;
    pivotMatrixRef.current = e.detail.pivotMatrix;
  };

  useEventListener(CAMERA_UPDATE, handleCameraUpdateEvent);
  const triggerAnnoClickEvent = useEventTrigger(ANNO_CLICK);

  // const handleCameraSleepEvent = () => {
  //   // console.log('camera sleep event');
  // };

  // useEventListener(CAMERA_SLEEP, handleCameraSleepEvent);

  const dragStart = (e: any) => {
    dragItemRef.current = parseInt(e.target.dataset.idx);
  };

  const dragEnter = (e: any) => {
    dragOverItemRef.current = parseInt(e.currentTarget.dataset.idx);
  };

  const drop = () => {
    // reorder annotations
    const copyListItems = [...annotations];
    const dragItemContent = copyListItems[dragItemRef.current as number];
    copyListItems.splice(dragItemRef.current as number, 1);
    copyListItems.splice(dragOverItemRef.current as number, 0, dragItemContent);

    dragItemRef.current = null;
    setAnnotations(copyListItems);
    setSelectedAnnotation(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const props = {
      label,
      description,
    }
    updateAnnotation(editIdx as number, props);
    setLabel('');
    setDescription('');
    setEditIdx(null);
  };

  function updateAnnotationCameraProps(idx: number) {
    const props = {
      ...(cameraPositionRef.current !== undefined && { 
        cameraPosition: cameraPositionRef.current.clone().applyMatrix4(pivotMatrixRef.current.clone().invert())
      }),
      ...(cameraTargetRef.current !== undefined && { 
        cameraTarget: cameraTargetRef.current.clone().applyMatrix4(pivotMatrixRef.current.clone().invert())
      })
    }
    updateAnnotation(idx, props);
  }

  function updateAnnotation(idx: number, props: Annotation) {
    const copyListItems = [...annotations];
    const updatedItem = {
      ...copyListItems[idx],
      ...props,
    };
    const updatedListItems = [
      ...copyListItems.slice(0, idx as number),
      updatedItem,
      ...copyListItems.slice((idx as number) + 1),
    ];
    setAnnotations(updatedListItems);
  }

  function deleteAnnotation(idx: number) {
    const annotation = annotations[idx];
    const message = annotation.label
      ? `Are you sure you want to delete the annotation "${annotation.label}"?`
      : 'Are you sure you want to delete this annotation?';

    if (window.confirm(message)) {
      setAnnotations(annotations.filter((_, i) => i !== idx));
      setEditIdx(null);
      if (selectedAnnotation === idx) {
        setSelectedAnnotation(null);
      }
    }
  }

  return (
    <Tab>
      <div className='flex flex-col justify-between grow'>
        <div className='grid gap-y-4'>
          <div className="overflow-y-auto overflow-x-hidden">
            {annotations.length ? (
              annotations.map((anno: Annotation, idx) => {
                return (
                  <div
                    key={idx}
                    className={cn('flex items-center justify-between my-2', {
                      'cursor-move': editIdx === null,
                    })}
                    draggable={editIdx === null}
                    onDragStart={(e) => dragStart(e)}
                    onDragEnter={(e) => dragEnter(e)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnd={drop}
                    data-idx={idx}>
                    {editIdx === idx && (
                      <form onSubmit={handleSubmit} className="flex items-end justify-between w-full py-2">
                        <div className="flex flex-col w-full mr-2">
                          <input
                            type="text"
                            placeholder="Label"
                            className="text-xs text-black mb-1 p-1"
                            defaultValue={anno.label}
                            required
                            maxLength={64}
                            onChange={(e) => {
                              setLabel(e.target.value);
                            }}
                          />
                          <textarea
                            placeholder="Description"
                            className="text-xs p-1 break-words text-black h-12"
                            defaultValue={anno.description}
                            maxLength={256}
                            onChange={(e) => {
                              setDescription(e.target.value);
                            }}
                          />
                        </div>
                        <div className="flex">
                          <Button className="p-2 h-8 text-black" variant="outline" type="submit">
                            <Check className="w-4" />
                          </Button>
                        </div>
                      </form>
                    )}
                    {editIdx !== idx && (
                      <>
                        <div
                          className="max-w-full"
                          onClick={() => {
                            triggerAnnoClickEvent(anno);
                            setSelectedAnnotation(idx);
                          }}>
                          <h3
                            className={cn(
                              'text-gray-400 font-medium text-sm md:text-md line-clamp-1 pr-1 whitespace-normal',
                              {
                                'text-white': selectedAnnotation === idx,
                              }
                            )}>{`${idx + 1}. ${anno.label || 'no label'}`}</h3>
                          <p className="text-xs text-zinc-400 line-clamp-1 pr-1 whitespace-normal">{anno.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* set default camera view button */}
                          <Tooltip content="Set Default View">
                            <Button
                              className="p-2 h-8 text-black"
                              variant="outline"
                              onClick={() => {
                                updateAnnotationCameraProps(idx);
                                setSelectedAnnotation(idx);
                              }}>
                              <View size="16" />
                            </Button>
                          </Tooltip>
                          {/* edit button */}
                          <Tooltip content="Edit Annotation">
                            <Button
                              className="p-2 h-8 text-black"
                              variant="outline"
                              onClick={() => {
                                setEditIdx(idx);
                                setLabel(anno.label);
                                setDescription(anno.description);
                                triggerAnnoClickEvent(anno);
                                setSelectedAnnotation(idx);
                              }}>
                              <Pencil size="16" />
                            </Button>
                          </Tooltip>
                          {/* delete button */}
                          <Tooltip content="Delete Annotation">
                            <Button
                              className="p-2 h-8"
                              variant="destructive"
                              onClick={() => {
                                deleteAnnotation(idx);
                              }}>
                              <X size="16" />
                            </Button>
                          </Tooltip>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            ) : (
              <Instructions>Double-click to create an annotation.</Instructions>
            )}
          </div>
        </div>

        <AnnotationsDialog />
      </div>
    </Tab>
  );
}

export default AnnotationTab;
