import { Text } from '@/components/ui/text';
import clsx from 'clsx';
import * as React from 'react';
import { Pressable, View } from 'react-native';

export function Page6() {
  const TABS = ['캘린더', '학사공지'];
  const [currentTab, setCurrentTab] = React.useState('캘린더');

  return (
    <View className="w-screen flex-1">
      {/* 탭 네비게이션 */}
      <View className="bg-grey-02">
        <View className="mt-2 flex-row">
          {TABS.map((label, index) => (
            <Pressable
              key={index}
              onPress={() => setCurrentTab(label)}
              className={clsx(
                'flex-1 py-2',
                currentTab === label
                  ? 'border-grey-10 rounded-t-sm border-e border-s border-t bg-white'
                  : 'border-grey-10 border-b'
              )}>
              <Text
                className={clsx(
                  'text-center',
                  currentTab === label ? 'text-body04 text-black' : 'text-body05 text-grey-40'
                )}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 본문 */}
      {currentTab === '캘린더' && (
        <View className="flex-1 p-4">
          <Text className="text-body04 text-black">캘린더 내용이 들어갑니다</Text>
        </View>
      )}
      {currentTab === '학사공지' && (
        <View className="flex-1 p-4">
          <Text className="text-body04 text-black">학사공지 내용이 들어갑니다</Text>
        </View>
      )}
    </View>
  );
}
