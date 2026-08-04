import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Tooltip } from './ui/tooltip';
import { Trash2 } from 'lucide-react';
import useStore from '@/Store';

export function AnnotationDeleteDialog({ 
  annoIdx, 
  onClick 
}: { 
  annoIdx: number, 
  onClick?: () => void }
) {
  const [open, setOpen] = useState(false);
  const { annotations, setAnnotations, setSelectedAnnotation } = useStore();

  function deleteAnnotation(idx: number) {
    setAnnotations(annotations.filter((_, i) => i !== idx));
    setSelectedAnnotation(null);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip content="Delete Annotation">
      <DialogTrigger asChild>
          <Button
            className="p-2 h-8"
            variant="destructive"
            onClick={() => { onClick && onClick();}}
          >
            <Trash2 size="16" />
          </Button>
      </DialogTrigger>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Annotation</DialogTitle>
          <DialogDescription>Are you sure you want to delete this annotation?</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="text-black">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteAnnotation(annoIdx)}>
            Delete Annotation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}