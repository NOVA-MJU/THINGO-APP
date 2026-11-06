// 학교 식단표 항목을 순서 그대로 보여준다. 메인 요리 같은 추정은 하지 않아 식단표 형식이 바뀌어도 틀린 정보를 보여주지 않는다.
// 식단이 없을 때 학교가 넣는 안내 문구만 뺀다. 문구가 바뀌면 그 문구가 메뉴처럼 한 줄 보일 뿐 화면은 깨지지 않는다
export function cleanMeals(meals: string[]) {
  return meals.map((m) => m.trim()).filter((m) => m && !m.startsWith('등록된 식단'));
}
