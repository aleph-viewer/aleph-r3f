import { Copy, FileInput, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import useStore from '@/Store';
import { copyText, downloadJsonFile, parseAnnotations } from '@/lib/utils';
import { createRef, useEffect, useState } from 'react';
import { CSVLink } from 'react-csv';
import { Tooltip } from './ui/tooltip';

export function AnnotationsDialog() {
  const [open, setOpen] = useState(false);
  const { annotations, setAnnotations } = useStore();

  function stringifyJson(value: any) {
    return JSON.stringify(value, null, 2);
  }

  const [json, setJson] = useState<string>('');

  useEffect(() => {
    setJson(stringifyJson(annotations));
  }, [annotations]);

  const jsonRef = createRef<HTMLTextAreaElement>();

  const csvHeaders = [
    { label: 'label', key: 'label' },
    { label: 'description', key: 'description' },
    { label: 'position_x', key: 'position.x' },
    { label: 'position_y', key: 'position.y' },
    { label: 'position_z', key: 'position.z' },
    { label: 'normal_x', key: 'normal.x' },
    { label: 'normal_y', key: 'normal.y' },
    { label: 'normal_z', key: 'normal.z' },
    { label: 'camera_position_x', key: 'cameraPosition.x' },
    { label: 'camera_position_y', key: 'cameraPosition.y' },
    { label: 'camera_position_z', key: 'cameraPosition.z' },
    { label: 'camera_target_x', key: 'cameraTarget.x' },
    { label: 'camera_target_y', key: 'cameraTarget.y' },
    { label: 'camera_target_z', key: 'cameraTarget.z' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <Tooltip content="Export or Import Annotations">
            <Button variant="link" className="p-0">
              <FileInput />
            </Button>
          </Tooltip>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export or Import Annotations</DialogTitle>
          {/* <DialogDescription></DialogDescription> */}
        </DialogHeader>
        <div className="flex items-start space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="json" className="sr-only">
              JSON
            </Label>
            <Textarea
              id="json"
              ref={jsonRef}
              defaultValue={json}
              onChange={(value) => {
                setJson(value.target.value);
              }}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Button
              type="button"
              size="sm"
              className="px-3 w-full"
              onClick={() => {
                jsonRef.current?.focus();
                jsonRef.current?.select();
                copyText(json);
              }}
            >
              <span className="sr-only">Copy</span>
              <div className="text-black mr-1 min-w-10">Copy</div>
              <Copy className="h-4 w-4 text-black" />
            </Button>
            <CSVLink 
              data={annotations}
              filename={'aleph_annotations.csv'}
              headers={csvHeaders}
            >
              <Button
                type="button"
                size="sm"
                className="px-3 w-full"
              >
                <span className="sr-only">Download as CSV</span>
                <div className="text-black mr-1 min-w-10">CSV</div>
                <FileDown className="h-4 w-4 text-black" />
              </Button>
            </CSVLink>
            <Button
              type="button"
              size="sm"
              className="px-3 w-full"
              onClick={() => { downloadJsonFile(json); }}
            >
              <span className="sr-only">Download as JSON</span>
              <div className="text-black mr-1 min-w-10">JSON</div>
              <FileDown className="h-4 w-4 text-black" />
            </Button>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="default"
            className="text-black"
            onClick={() => {
              try {
                const annos = parseAnnotations(json);
                setAnnotations(annos);
                setOpen(false);
              } catch (e) {
                console.error(e);
              }
            }}>
            Update
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="text-black">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
