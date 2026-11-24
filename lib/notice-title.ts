// 학교 공지 제목은 "[한국장학재단] 2027년 1학기 국가장학금 신청 안내"처럼 앞에 부서·기관 머리말이 붙어,
// 한 줄 목록에서는 머리말만 보이고 정작 제목이 잘린다. 목록에서는 앞쪽 [..] 머리말을 빼고 보여준다.
// 머리말은 공지 본문을 열면 그대로 보인다. 제목 중간의 [..]는 내용의 일부라 남긴다
const LEADING_TAGS = /^(?:\s*\[[^\]]*\])+\s*/;

export function stripNoticeTitleTags(title: string): string {
  const stripped = title.replace(LEADING_TAGS, '');
  return stripped || title;
}
