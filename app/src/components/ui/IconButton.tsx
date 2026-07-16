import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Icon-only button.
 *
 * Common pitfall: a `<button>` with `p-1.5` and a child `<Icon />` doesn't
 * center the icon — the icon sits at the top-left because the button uses
 * inline-block layout. Wrapping with this component adds the missing
 * `inline-flex items-center justify-center` so the glyph is always centered.
 *
 * Sizing: square buttons. Use `size="xs" | "sm" | "md"` for the standard
 * tiers; defaults to `sm` (32×32). Pass any extra Tailwind via `className`.
 */
export type IconButtonSize = 'xs' | 'sm' | 'md';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  variant?: 'ghost' | 'subtle' | 'danger';
}

const sizeMap: Record<IconButtonSize, string> = {
  xs: 'w-7 h-7',
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
};

const variantMap: Record<NonNullable<IconButtonProps['variant']>, string> = {
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  subtle: 'text-muted-foreground hover:bg-white/[0.04] hover:text-white',
  danger: 'text-red-400 hover:bg-red-500/10',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      size = 'sm',
      variant = 'ghost',
      className,
      type = 'button',
      children,
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-colors',
          'disabled:opacity-30 disabled:pointer-events-none',
          sizeMap[size],
          variantMap[variant],
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);