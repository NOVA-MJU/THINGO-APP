import { cn } from '@/lib/utils';
import { Platform, TextInput } from 'react-native';

function Input({ className, ...props }: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      className={cn(
        'flex h-10 w-full min-w-0 flex-row items-center rounded-[8px] border border-grey-10 bg-background px-3 py-[9.5px] text-base leading-5 text-foreground dark:bg-input/30 sm:h-9',
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
          ),
        Platform.select({
          web: cn(
            'outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground placeholder:text-body06 placeholder:text-grey-20 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-body06 placeholder:text-grey-20',
        }),
        className
      )}
      {...props}
    />
  );
}

export { Input };
