import Head from 'expo-router/head';
import NewsScreen from './_components/news-screen';

const TITLE = '명대방송국 | 띵고 Thingo';
const DESCRIPTION =
  '읽는 대신 보는 학교 소식. 명지대학교와 명대방송국의 영상 뉴스를 한곳에서 만나보세요!';

// web 라우팅용 링크임다
export default function NewsPage() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
      </Head>
      <NewsScreen />
    </>
  );
}
