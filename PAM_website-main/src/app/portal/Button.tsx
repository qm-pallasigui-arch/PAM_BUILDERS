import type { ComponentProps } from 'react';
import { Loader2 } from 'lucide-react';
import { Button as BaseButton } from '../components/ui/button';
import { cn } from '../components/ui/utils';

// Shared portal action sizing, including dialogs rendered outside the page layout.
export function Button({ className, size, loading = false, loadingLabel = 'Saving...', children, disabled, ...props }: ComponentProps<typeof BaseButton> & { loading?: boolean; loadingLabel?: string }) {
  const iconOnly = size === 'icon';
  return <BaseButton {...props} disabled={disabled || loading} aria-busy={loading || undefined} size={iconOnly ? 'icon' : 'default'} className={cn(
    'enabled:active:translate-y-px motion-reduce:transition-none',
    iconOnly ? 'size-9' : 'h-9 gap-2 px-4 py-2 text-sm font-medium has-[>svg]:px-4',
    className,
  )}>{loading && !props.asChild ? <><Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />{loadingLabel}</> : children}</BaseButton>;
}
