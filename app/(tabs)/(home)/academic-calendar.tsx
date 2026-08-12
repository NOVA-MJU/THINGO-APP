import Head from 'expo-router/head';
import AcademicCalendarScreen from './_components/academic-calendar-screen';

const TITLE = '명지대 학사일정 | 띵고 Thingo';
const DESCRIPTION =
  '명지대학교 학사일정을 한눈에. 수강신청도 시험도 놓치지 않게, 달력으로 미리 챙겨보세요!';

// web 라우팅용 링크임다
export default function AcademicPage() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
      </Head>
      <AcademicCalendarScreen />
    </>
  );
}
