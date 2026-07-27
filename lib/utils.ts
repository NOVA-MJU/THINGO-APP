import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-heading01',
        'text-heading02',
        'text-title01',
        'text-title02',
        'text-title03',
        'text-body01',
        'text-body02',
        'text-body03',
        'text-body04',
        'text-body05',
        'text-body06',
        'text-caption01',
        'text-caption02',
        'text-caption03',
        'text-caption04',
        'text-caption05',
        'text-caption06',
      ],
      'text-color': [
        'text-black',
        'text-white',
        { 'text-mju': ['primary', 'secondary'] },
        { 'text-blue': ['35', '20', '15', '10', '05', '02'] },
        'text-error',
        { 'text-grey': ['80', '60', '40', '30', '20', '10', '02'] },
      ],
      'bg-color': [
        'bg-black',
        'bg-white',
        { 'bg-mju': ['primary', 'secondary'] },
        { 'bg-blue': ['35', '20', '15', '10', '05', '02'] },
        'bg-error',
        { 'bg-grey': ['80', '60', '40', '30', '20', '10', '02'] },
      ],
      'border-color': [
        'border-black',
        'border-white',
        { 'border-mju': ['primary', 'secondary'] },
        { 'border-blue': ['35', '20', '15', '10', '05', '02'] },
        'border-error',
        { 'border-grey': ['80', '60', '40', '30', '20', '10', '02'] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 서버 타임스탬프 응답값 뒤에 Z가 없는 경우 자동으로 추가
export function parseUTCDate(dateStr: string): Date {
  if (dateStr.endsWith('Z')) return new Date(dateStr);
  return new Date(dateStr + 'Z');
}

// `n분 전` `어제` 같은 상대시간으로 변경
export function formatTimeAgo(dateStr: string): string {
  const date = parseUTCDate(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${date.getMonth() + 1}.${date.getDate()}`;
}
