import * as React from 'react';
import * as ToolbarPrimitive from '@radix-ui/react-toolbar';
import { cn } from '@/lib/utils';
import { Tooltip } from './tooltip';

const Toolbar = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToolbarPrimitive.Root
    ref={ref}
    className={cn('p-3 text-white control-component', className)}
    {...props}
  />
));
  
const Button = ToolbarPrimitive.Button;

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.ToggleGroup>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.ToggleGroup>
>(({ className, ...props }, ref) => (
  <ToolbarPrimitive.ToggleGroup
    ref={ref}
    className={cn('', className)}
    {...props}
  />
));

const ToggleItem = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.ToggleItem>,
  React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.ToggleItem>
>(({ className, ...props }, ref) => (
  <ToolbarPrimitive.ToggleItem
    ref={ref}
    className={cn('h-8 w-8 flex items-center justify-center border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 data-[state=on]:bg-primary', className)}
    {...props}
  />
));

function ToggleItemTooltip({
  value,
  description,
  children,
  disabled = false,
  tooltipSide = 'top',
}: {
  value: string,
  description: string,
  children: React.ReactNode,
  disabled?: boolean,
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left',
}) {
  return (
    <Tooltip content={description} side={tooltipSide} {...(disabled ? { open: false } : {})}>
      <div>
        <ToggleItem value={value} aria-label={description} disabled={disabled}>
          { children }
        </ToggleItem>  
      </div>
    </Tooltip>
  );

}

const Separator = ToolbarPrimitive.Separator;

export { Toolbar, Button, ToggleGroup, ToggleItem, Separator, ToggleItemTooltip };
