import Head from 'expo-router/head';
import { NoticeBoardScreen } from './_components/notice-board-page';

const TITLE = '명지대 학생 게시판 | 띵고 Thingo';
const DESCRIPTION =
  '명지대 학생들의 진짜 이야기. 정보 게시판부터 자유 게시판까지, 지금 뜨거운 글을 만나보세요!';

// web 라우팅용 링크임다
export default function BoardPage() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
      </Head>
      <NoticeBoardScreen />
    </>
  );
}
