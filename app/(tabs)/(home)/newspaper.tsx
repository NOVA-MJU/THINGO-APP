import Head from 'expo-router/head';
import NewspaperScreen from './_components/newspaper-screen';

const TITLE = '명대신문 | 띵고 Thingo';
const DESCRIPTION = '캠퍼스의 오늘을 전하는 명대신문. 최신 기사를 가장 빠르게 읽어보세요!';

// web 라우팅용 링크임다
export default function NewspaperPage() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
      </Head>
      <NewspaperScreen />
    </>
  );
}
