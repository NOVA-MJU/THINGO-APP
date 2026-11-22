// 네이버 지도 글자로 띵고에 처음 넣는 가게의 종류. 서버(POST /map/symbol-places)는 대동명지도 하위 종류만 받는다
export const DAEDONG_PLACE_CATEGORIES = [
  { code: 'daedong-kr', label: '한식' },
  { code: 'daedong-cafe', label: '카페·디저트' },
  { code: 'daedong-bar', label: '주류' },
  { code: 'daedong-meat', label: '고기' },
  { code: 'daedong-snack', label: '간편식·분식' },
  { code: 'daedong-jp', label: '일식' },
  { code: 'daedong-cn', label: '중식' },
  { code: 'daedong-western', label: '양식·아시안' },
] as const;

export type DaedongPlaceCategoryCode = (typeof DAEDONG_PLACE_CATEGORIES)[number]['code'];

// 이름에 업종이 드러나는 가게만 미리 고른다. 앞에 있는 종류가 먼저다(카페 이름에 '바'가 들어가도 카페로, 순대국밥은 분식보다 한식)
const CATEGORY_NAME_PATTERNS: [DaedongPlaceCategoryCode, RegExp][] = [
  [
    'daedong-cafe',
    /카페|커피|cafe|coffee|베이커리|bakery|제과|빵|디저트|케이크|cake|도넛|와플|마카롱|젤라또|아이스크림|빙수|티하우스|스무디|쥬스|주스/i,
  ],
  ['daedong-bar', /포차|호프|이자카야|주점|술집|맥주|와인|막걸리|칵테일|pub|\bbar\b/i],
  ['daedong-jp', /스시|초밥|라멘|라면|돈카츠|돈까스|우동|소바|규동|덮밥|오마카세|사케/],
  ['daedong-cn', /짜장|짬뽕|중화|반점|마라|훠궈|양꼬치|딤섬|탕수육/],
  ['daedong-meat', /고기|갈비|삼겹|정육|숯불|곱창|막창|족발|보쌈|한우/],
  [
    'daedong-western',
    /파스타|피자|pizza|버거|burger|스테이크|브런치|쌀국수|타코|커리|카레|샐러드|샌드위치|태국|베트남|인도/i,
  ],
  ['daedong-kr', /국밥|찌개|백반|한식|냉면|칼국수|설렁탕|감자탕|해장국|비빔밥|죽|순두부|보리밥/],
  ['daedong-snack', /분식|떡볶이|김밥|토스트|도시락|핫도그|만두|순대|컵밥/],
];

// 이름으로 짐작이 안 되면 null. 사용자가 직접 고른다
export function guessPlaceCategory(name: string): DaedongPlaceCategoryCode | null {
  return CATEGORY_NAME_PATTERNS.find(([, pattern]) => pattern.test(name))?.[0] ?? null;
}
