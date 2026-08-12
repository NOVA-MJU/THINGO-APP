import Head from 'expo-router/head';
import MealScreen from './_components/meal-screen';

const TITLE = '명지대 학식 식단표 | 띵고 Thingo';
const DESCRIPTION =
  '오늘 뭐 먹지? 메뉴 고민은 끝, 명지대 학생식당 조식·중식·석식을 한눈에 확인해보세요!';

// web 라우팅용 링크임다
export default function MealPage() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
      </Head>
      <MealScreen />
    </>
  );
}
