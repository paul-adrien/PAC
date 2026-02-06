import type { ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';

type TextVariant = 'xs' | 'sm' | 'base' | 'muted' | 'label' | 'caption' | 'danger';
type TextAlign = 'left' | 'center' | 'right';

type TextProps<T extends ElementType = 'p'> = {
  as?: T;
  children: ReactNode;
  variant?: TextVariant;
  align?: TextAlign;
  className?: string;
} & ComponentPropsWithoutRef<T>;

const baseClass = 'text-gray-900';

const variantClasses: Record<TextVariant, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-sm',
  muted: 'text-sm text-gray-500',
  label: 'text-sm font-medium text-gray-700',
  caption: 'text-xs text-gray-500',
  danger: 'text-sm text-red-600',
};

const alignClasses: Record<TextAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Text<T extends ElementType = 'p'>({
  as,
  children,
  variant = 'base',
  align = 'left',
  className = '',
  ...rest
}: TextProps<T>) {
  const classes = [baseClass, variantClasses[variant], alignClasses[align], className]
    .filter(Boolean)
    .join(' ');

  return (
    <p className={classes} {...rest}>
      {children}
    </p>
  );
}
