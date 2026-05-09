export const DEPARTMENT_OPTIONS = [
  {
    college: { value: 'HUMANITIES', label: '인문대학' },
    departments: [
      { label: '아시아·중동어문학부', value: 'ASIA_MIDDLE_EAST_LANGUAGES' },
      { label: '중어중문학전공', value: 'CHINESE_LITERATURE' },
      { label: '일어일문학전공', value: 'JAPANESE_LITERATURE' },
      { label: '아랍지역학전공', value: 'ARABIC_STUDIES' },
      { label: '글로벌한국어학전공', value: 'KOREAN_STUDIES' },
      { label: '인문콘텐츠학부', value: 'CULTURAL_CONTENT_STUDIES' },
      { label: '국어국문학전공', value: 'KOREAN_LITERATURE' },
      { label: '영어영문학전공', value: 'ENGLISH_LITERATURE' },
      { label: '미술사·역사학전공', value: 'ART_HISTORY' },
      { label: '미술사학과', value: 'ART_HISTORY_DEPARTMENT' },
      { label: '사학과', value: 'HISTORY_DEPARTMENT' },
      { label: '문헌정보학전공', value: 'LIBRARY_SCIENCE' },
      { label: '글로벌문화콘텐츠학전공', value: 'GLOBAL_CULTURAL_CONTENT_STUDIES' },
      { label: '문예창작학과', value: 'CREATIVE_WRITING' },
      { label: '철학과', value: 'PHILOSOPHY' },
    ],
  },
  {
    college: { value: 'SOCIAL_SCIENCES', label: '사회과학대학' },
    departments: [
      { label: '공공인재학부', value: 'SCHOOL_OF_PUBLIC_SERVICE' },
      { label: '행정학전공', value: 'PUBLIC_ADMINISTRATION' },
      { label: '정치외교학전공', value: 'POLITICAL_DIPLOMACY' },
      { label: '경상·통계학부', value: 'ECONOMICS_STATISTICS' },
      { label: '경제학전공', value: 'ECONOMICS' },
      { label: '국제통상학전공', value: 'INTERNATIONAL_TRADE' },
      { label: '응용통계학전공', value: 'APPLIED_STATISTICS' },
      { label: '법학과', value: 'LAW' },
    ],
  },
  {
    college: { value: 'BUSINESS', label: '경영대학' },
    departments: [
      { label: '경영학부', value: 'BUSINESS_DEPARTMENT' },
      { label: '경영학전공', value: 'BUSINESS_ADMINISTRATION' },
      { label: '글로벌비즈니스학전공', value: 'GLOBAL_BUSINESS_STUDIES' },
      { label: '경영정보학과', value: 'MANAGEMENT_INFORMATION_SYSTEMS' },
    ],
  },
  {
    college: { value: 'MEDIA_HUMANLIFE', label: '미디어·휴먼라이프대학' },
    departments: [
      { label: '디지털미디어학부', value: 'DIGITAL_MEDIA_STUDIES' },
      { label: '청소년지도·아동학부', value: 'YOUTH_GUIDANCE_CHILD_STUDIES' },
      { label: '청소년지도학전공', value: 'YOUTH_GUIDANCE_STUDIES' },
      { label: '아동학전공', value: 'CHILD_STUDIES' },
    ],
  },
  {
    college: { value: 'AI_SOFTWARE', label: '인공지능·소프트웨어융합대학' },
    departments: [
      { label: '융합소프트웨어학부', value: 'CONVERGENT_SOFTWARE_STUDIES' },
      { label: '응용소프트웨어전공', value: 'APPLICATION_SOFTWARE' },
      { label: '데이터사이언스전공', value: 'DATA_SCIENCE' },
      { label: '인공지능전공', value: 'AI' },
      { label: '디지털콘텐츠디자인학과', value: 'DIGITAL_CONTENT_DESIGN_STUDIES' },
    ],
  },
  {
    college: { value: 'FUTURE_CONVERGENCE', label: '미래융합대학' },
    departments: [
      { label: '창의융합인재학부', value: 'CREATIVE_CONVERGENCE_TALENT_DEPARTMENT' },
      { label: '사회복지학과', value: 'SOCIAL_WELFARE' },
      { label: '부동산학과', value: 'REAL_ESTATE' },
      { label: '법무행정학과', value: 'LAW_ADMINISTRATION' },
      { label: '심리치료학과', value: 'PSYCHOLOGY_THERAPY' },
      { label: '미래융합경영학과', value: 'FUTURE_CONVERGENCE_BUSINESS' },
      { label: '멀티디자인학과', value: 'MULTI_DESIGN' },
      { label: '회계세무학과', value: 'ACCOUNTING_TAXATION' },
      { label: '계약학과', value: 'CONTRACT' },
    ],
  },
  {
    college: { value: 'HONOR', label: '아너칼리지(전공자유대학)' },
    departments: [{ label: '자율전공학부(인문)', value: 'FREE_MAJOR' }],
  },
];

export const COLLEGE_OPTIONS = DEPARTMENT_OPTIONS.map((d) => d.college);
