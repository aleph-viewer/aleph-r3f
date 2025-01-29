'use client';

import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Label } from './ui/label';

export function Selector({
  label,
  description,
  children,
  inline,
  labelPadding,
  noPaddingTop
}: {
  label: string;
  description: string;
  children: React.ReactNode;
  inline?: boolean;
  labelPadding?: boolean;
  noPaddingTop?: boolean;
}) {
  return (
    <div className={ `grid gap-4 ${ noPaddingTop ? '' : 'pt-4' }` }>
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className={ inline ? "flex justify-between" : "grid gap-4" }>
            <div className="flex items-center justify-between">
              <Label className={ `text-white whitespace-normal ${labelPadding ? 'p-2' : ''}` }>{label}</Label>
            </div>
            <div className="grid gap-4">{children}</div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-[260px] text-sm whitespace-normal text-black" side="left">
          {description}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
