import { Text } from '@/components/ui/text';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

const WINDOW_SIZE = 5;

function getPageWindow(currentPage: number, totalPages: number): number[] {
  const blockStart = Math.floor((currentPage - 1) / WINDOW_SIZE) * WINDOW_SIZE + 1;
  const blockEnd = Math.min(totalPages, blockStart + WINDOW_SIZE - 1);
  return Array.from({ length: blockEnd - blockStart + 1 }, (_, i) => blockStart + i);
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = getPageWindow(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        className="flex-row items-center"
        onPress={() => hasPrev && onPageChange(currentPage - 1)}
        disabled={!hasPrev}>
        <ChevronLeft className={clsx(hasPrev ? 'text-grey-30' : 'text-grey-20')} />
        <Text className={clsx('text-caption02', hasPrev ? 'text-grey-30' : 'text-grey-20')}>
          이전
        </Text>
      </Pressable>

      <View className="flex-row">
        {pages.map((page) => (
          <Pressable
            key={page}
            className="h-6 w-6 items-center justify-center"
            onPress={() => onPageChange(page)}>
            {page === currentPage ? (
              <View className="bg-mju-primary h-5 w-5 items-center justify-center rounded-full">
                <Text className="text-caption01 text-white">{page}</Text>
              </View>
            ) : (
              <View className="bg-grey-30 h-1.5 w-1.5 rounded-full" />
            )}
          </Pressable>
        ))}
      </View>

      <Pressable
        className="flex-row items-center"
        onPress={() => hasNext && onPageChange(currentPage + 1)}
        disabled={!hasNext}>
        <Text className={clsx('text-caption02', hasNext ? 'text-grey-30' : 'text-grey-20')}>
          다음
        </Text>
        <ChevronRight className={clsx(hasNext ? 'text-grey-30' : 'text-grey-20')} />
      </Pressable>
    </View>
  );
}
