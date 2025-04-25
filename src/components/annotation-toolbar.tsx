import { ChevronLeft, ChevronRight } from 'lucide-react';
import {  ANNO_CLICK } from '@/types';
import { buttonVariants } from './ui/button';
import { Toolbar, Button } from "./ui/toolbar";
import useStore from '@/Store';
import { useEventTrigger } from '@/lib/hooks/use-event';
import { cn } from '@/lib/utils';
import { Tooltip } from './ui/tooltip';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from './ui/dropdown';

export function AnnotationToolbar() {
  const {
    annotations,
    selectedAnnotation,
    setSelectedAnnotation,
  } = useStore();

  const triggerAnnoClickEvent = useEventTrigger(ANNO_CLICK);

  function mod(num: number, modulus: number) {
    return ((num % modulus) + modulus) % modulus;
  }

  return (
    <>
      { (annotations.length > 0) && 
        <div id="annotation-toolbar" className="absolute bottom-5 w-full flex justify-center" style={{ zIndex: 51 }}>
          <Toolbar orientation="horizontal" className="flex justify-between items-center w-[300px] control-component" style={{ borderRadius: '0.5rem' }}>
            <Tooltip content="Previous Annotation">
              <Button className={cn(buttonVariants({ variant: 'link', size: 'iconSm', className: 'text-white' }))}
                onClick={() => {
                  const newIdx = selectedAnnotation !== null ? mod(selectedAnnotation - 1, annotations.length) : annotations.length - 1;
                  triggerAnnoClickEvent(annotations[newIdx]);
                  setSelectedAnnotation(newIdx);
                }}
              >
                <span className="sr-only">Previous Annotation</span>
                <ChevronLeft />
              </Button>
            </Tooltip>
            <Dropdown>
              <DropdownTrigger>
                <span className="font-medium text-sm md:text-md line-clamp-1 p-1 whitespace-normal">
                  { selectedAnnotation !== null ? annotations[selectedAnnotation].label || `No Label` : 'Select Annotation' }
                </span>
              </DropdownTrigger>
              <DropdownContent portalContainer={document.getElementById('annotation-toolbar') || document.body} side="top" style={{ zIndex: 999 }}>
                { annotations.map((anno, idx) => 
                  <DropdownItem 
                    onSelect={(event) => {
                      const target = event.currentTarget as HTMLElement;
                      const idx = target.dataset.annoIdx;
                      if (idx) {
                        triggerAnnoClickEvent(annotations[parseInt(idx)]);
                        setSelectedAnnotation(parseInt(idx));
                      }
                    }} 
                    key={idx} 
                    data-anno-idx={idx}
                    className={selectedAnnotation === idx ? 'text-white' : 'text-gray-400'}
                  >
                    { `${idx + 1}. ${anno.label || 'No Label'}` }
                  </DropdownItem>
                )}
              </DropdownContent>
            </Dropdown>

            
            <Tooltip content="Next Annotation">
              <Button className={cn(buttonVariants({ variant: 'link', size: 'iconSm', className: 'text-white' }))}
                onClick={() => {
                  const newIdx = selectedAnnotation !== null ? mod(selectedAnnotation + 1, annotations.length) : 0;
                  triggerAnnoClickEvent(annotations[newIdx]);
                  setSelectedAnnotation(newIdx);
                }}
              >
                <span className="sr-only">Next Annotation</span>
                <ChevronRight />
              </Button>
            </Tooltip>
          </Toolbar>
        </div> 
      }
    </>
  );
}