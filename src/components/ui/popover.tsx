import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <PopoverPrimitive.Trigger ref={ref} className={cn('', className)} {...props}>
    {children}
  </PopoverPrimitive.Trigger>
));

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { portalContainer?: HTMLElement }
>(({ className, children, portalContainer, ...props }, ref) => (
  <PopoverPrimitive.Portal container={portalContainer || document.getElementById('viewer') || document.body}>
    <PopoverPrimitive.Content
      ref={ref}
      className={cn('text-white font-medium text-sm bg-[#1f1f26] rounded-[0.5rem]', className)}
      sideOffset={12}
      {...props}
      // Above the full-viewport measurement/annotation overlay (zIndexRange up to 50)
      style={{ ...props.style, zIndex: 100 }}
    >
      {children}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));

export { Popover, PopoverTrigger, PopoverContent };
