// 학교 공지 제목은 "[한국장학재단] 2027년 1학기 국가장학금 신청 안내"처럼 앞에 부서·기관 머리말이 붙어,
// 한 줄 목록에서는 머리말만 보이고 정작 제목이 잘린다. 목록에서는 앞쪽 [..] 머리말을 제목 뒤로 옮겨
// 제목부터 읽히게 하고, 줄이 넘치면 뒤에 붙은 머리말부터 잘리게 한다. 제목 중간의 [..]는 내용의 일부라 그대로 둔다
const LEADING_TAGS = /^(?:\s*\[[^\]]*\])+\s*/;
const TAG = /\[[^\]]*\]/g;

export function moveNoticeTitleTagsToEnd(title: string): string {
  const leading = title.match(LEADING_TAGS)?.[0];
  if (!leading) return title;
  const rest = title.slice(leading.length).trim();
  if (!rest) return title;
  return `${rest} ${leading.match(TAG)?.join(' ')}`;
}
