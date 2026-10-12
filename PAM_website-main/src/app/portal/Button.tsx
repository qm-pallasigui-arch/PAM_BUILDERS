import type { ComponentProps } from 'react';
import { Button as BaseButton } from '../components/ui/button';
import { cn } from '../components/ui/utils';

// Shared portal action sizing, including dialogs rendered outside the page layout.
export function Button({ className, size, ...props }: ComponentProps<typeof BaseButton>) {
  const iconOnly = size === 'icon';
  return <BaseButton {...props} size={iconOnly ? 'icon' : 'default'} className={cn(
    iconOnly ? 'size-9' : 'h-9 gap-2 px-4 py-2 text-sm font-medium has-[>svg]:px-4',
    className,
  )} />;
}
