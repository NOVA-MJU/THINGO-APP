// 캠퍼스 건물 마커를 번호 이미지 대신 건물 이름 라벨(알약 모양)로 그린다.
// 네이티브 마커는 그리기 전에 크기를 정해야 해서 Pretendard SemiBold 12px 기준으로 글자 폭을 어림한다
export const BUILDING_LABEL_HEIGHT = 22;
export const BUILDING_LABEL_FONT_SIZE = 11;
const BUILDING_LABEL_PADDING_X = 8;

export const BUILDING_LABEL_COLORS = {
  background: '#FFFFFF',
  border: '#BBD7FF',
  text: '#1778FF',
  activeBackground: '#1778FF',
  activeText: '#FFFFFF',
};

export function buildingLabelWidth(name: string) {
  return Math.ceil(
    estimateTextWidth(name, BUILDING_LABEL_FONT_SIZE) + BUILDING_LABEL_PADDING_X * 2
  );
}

// fontSize 12 기준 어림 폭 (Pretendard와 iOS 기본 한글 글꼴 모두 한글 한 자가 글자 크기와 거의 같다). 다른 크기는 비율로 맞춘다
const ESTIMATE_BASE_FONT_SIZE = 12;

export function estimateTextWidth(text: string, fontSize: number) {
  let width = 0;
  for (const char of text) {
    if (/[가-힣]/.test(char)) width += 12.5;
    else if (/[A-Z]/.test(char)) width += 8.5;
    else if (char === ' ') width += 3.5;
    else width += 7;
  }
  return (width * fontSize) / ESTIMATE_BASE_FONT_SIZE;
}

// 내 사진첩 기준 "다녀온 곳"(리뷰 남길 곳) 핀. 건물 라벨과 구분되게 다홍색 말풍선으로 그린다
export const REVIEW_PIN_COLOR = '#FF6B4A';
// 누른 다녀온 곳 핀. 한 단계 진하게 해서 눌렀다는 게 보이게 한다
export const REVIEW_PIN_ACTIVE_COLOR = '#E04A28';
export const REVIEW_PIN_FONT_SIZE = 12;
export const REVIEW_PIN_BODY_HEIGHT = 28;
export const REVIEW_PIN_TAIL_HEIGHT = 6;
const REVIEW_PIN_PADDING_X = 12;

// 핀 글자 한 줄 (네이티브 SDK 캡션으로 그린다). 이름이 있으면 "{이름}  사진 N", 없으면 "내가 찍은 사진 N장"만.
// 다녀온 곳 핀은 사진 위치로 가게를 가릴 수 없어서 이름 없이 사진 수만 띄운다
export function reviewPinText(name: string, photoCount: number) {
  return name ? `${name}  사진 ${photoCount}` : `내가 찍은 사진 ${photoCount}장`;
}

export function reviewPinWidth(name: string, photoCount: number) {
  return Math.ceil(
    estimateTextWidth(reviewPinText(name, photoCount), REVIEW_PIN_FONT_SIZE) +
      REVIEW_PIN_PADDING_X * 2
  );
}
