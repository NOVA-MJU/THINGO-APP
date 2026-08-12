import Head from 'expo-router/head';
import NoticeScreen from './_components/notice-screen';

const TITLE = '명지대 공지사항 | 띵고 Thingo';
const DESCRIPTION =
  '명지대학교 공지사항을 한곳에. 놓치는 소식은 끝, 학사·장학·진로 공지를 가장 빠르게 확인해보세요!';

// web 라우팅용 링크임다
export default function NoticePage() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
      </Head>
      <NoticeScreen />
    </>
  );
}
