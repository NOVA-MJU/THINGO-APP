import CloseIcon from '@/components/icons/close';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

type InputProps = React.ComponentPropsWithRef<typeof TextInput> & {
  clearable?: boolean;
};

function Input({ className, ref, clearable, onChangeText, value, style, ...props }: InputProps) {
  const innerRef = useRef<TextInput>(null);
  const inputRef = (ref ?? innerRef) as React.RefObject<TextInput>;
  const showClear = clearable && !!value;

  // ios 에서 입력된 텍스트처짐 문제를 개선하기 위한 값입니다. android 와 ios 는 관련이 없습니다.
  const mergedStyle = [Platform.OS === 'ios' && { lineHeight: undefined }, style];

  if (!clearable) {
    return (
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        style={mergedStyle}
        className={cn(
          Platform.select({ android: 'text-body05', web: 'text-body05' }),
          'font-pretendard',
          'text-black',
          'placeholder:text-grey-20',
          'flex h-10 w-full min-w-0 flex-row items-center rounded-[8px] border border-grey-10 px-3 py-0',
          props.editable === false &&
            cn(
              'opacity-50',
              Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
            ),
          Platform.select({
            web: cn(
              'outline-none transition-[color,box-shadow]',
              'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              'aria-invalid:border-error'
            ),
          }),
          className
        )}
        {...props}
      />
    );
  }

  return (
    <View className={cn('relative', className)}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        style={mergedStyle}
        className={cn(
          Platform.select({ android: 'text-body05', web: 'text-body05' }),
          'font-pretendard',
          'text-black',
          'placeholder:text-grey-20',
          'flex h-10 w-full min-w-0 flex-row items-center rounded-[8px] border border-grey-10 py-0',
          showClear ? 'pl-3 pr-9' : 'px-3',
          props.editable === false &&
            cn(
              'opacity-50',
              Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
            ),
          Platform.select({
            web: cn(
              'outline-none transition-[color,box-shadow]',
              'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              'aria-invalid:border-error'
            ),
          })
        )}
        {...props}
      />
      {showClear && (
        <Pressable
          onPress={() => {
            onChangeText?.('');
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-0 h-10 items-center justify-center"
          hitSlop={8}
          tabIndex={-1}
        >
          <CloseIcon size={20} />
        </Pressable>
      )}
    </View>
  );
}

export { Input };
