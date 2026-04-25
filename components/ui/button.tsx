import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-lg shadow-none active:opacity-80',
    'px-4 py-2.5',
    Platform.select({
      web: "aria-invalid:ring-destructive/20 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn('bg-blue-35', Platform.select({ web: 'hover:opacity-80' })),
        secondary: cn('bg-grey-40', Platform.select({ web: 'hover:opacity-80' })),
        muted: cn('bg-grey-02', Platform.select({ web: 'hover:opacity-80' })),
        destructive: cn(
          'bg-error',
          Platform.select({
            web: 'focus-visible:ring-error/40 hover:opacity-80',
          })
        ),
        outline: cn(
          'border border-border bg-background',
          Platform.select({ web: 'hover:bg-accent' })
        ),
        ghost: cn('', Platform.select({ web: 'hover:bg-grey-02' })),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn('text-body05', Platform.select({ web: 'pointer-events-none transition-colors' })),
  {
    variants: {
      variant: {
        default: 'text-white',
        secondary: 'text-white',
        muted: 'text-grey-40',
        destructive: 'text-white',
        outline: cn('', Platform.select({ web: 'group-hover:text-accent-foreground' })),
        ghost: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
