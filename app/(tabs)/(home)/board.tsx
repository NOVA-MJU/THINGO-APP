import { NoticeBoardScreen } from './_components/notice-board-page';
import { useLocalSearchParams } from 'expo-router';

// web 라우팅용 링크임다
export default function BoardPage() {
  const { boardCategory } = useLocalSearchParams<{
    boardCategory?: string | string[];
  }>();
  const category = Array.isArray(boardCategory) ? boardCategory[0] : boardCategory;

  return (
    <NoticeBoardScreen
      initialCategory={category === 'free' || category === 'info' ? category : undefined}
    />
  );
}
