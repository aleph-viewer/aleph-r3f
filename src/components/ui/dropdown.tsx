import * as React from 'react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

const Dropdown = DropdownPrimitive.Root;

const DropdownTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <DropdownPrimitive.Trigger ref={ref} className={cn('', className)} {...props}>
    {children}
  </DropdownPrimitive.Trigger>
));

const DropdownContent = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content 
      ref={ref} 
      className={cn('cursor-pointer text-white font-medium text-sm md:text-md p-2 bg-[#1f1f26] rounded-[0.5rem] w-[200px]', className)} 
      sideOffset={20}
      {...props}
    >
      {children}
    </DropdownPrimitive.Content>
  </DropdownPrimitive.Portal>
));

const DropdownItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <DropdownPrimitive.Item 
    ref={ref} 
    className={cn('p-1 line-clamp-1', className)} 
    {...props}
  >
    {children}
  </DropdownPrimitive.Item>
));

export { Dropdown, DropdownTrigger, DropdownContent, DropdownItem };