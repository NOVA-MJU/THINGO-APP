import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-heading01', 'text-heading02',
        'text-title01', 'text-title02', 'text-title03',
        'text-body01', 'text-body02', 'text-body03', 'text-body04', 'text-body05', 'text-body06',
        'text-caption01', 'text-caption02', 'text-caption03', 'text-caption04', 'text-caption05', 'text-caption06',
      ],
      'text-color': [
        'text-black', 'text-white',
        { 'text-mju': ['primary', 'secondary'] },
        { 'text-blue': ['35', '20', '15', '10', '05'] },
        'text-error',
        { 'text-grey': ['80', '60', '40', '30', '20', '10', '02'] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
