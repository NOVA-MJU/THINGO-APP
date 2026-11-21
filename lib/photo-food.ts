// 사진 분류 라벨(Apple Vision VNClassifyImageRequest 식별자)로 음식 사진인지, 어떤 가게에서 찍었을 법한지 본다.
// 라벨은 modules/photo-location-scan의 classifyPhotos가 기기 안에서 만든다. 목록은 Vision이 지원하는 식별자에서 골랐다

// 음식·음료가 찍힌 사진. 식당 내부(restaurant, dining_room)나 빈 그릇(plate, cup)만 찍힌 사진은 뺀다
const FOOD_LABELS = new Set([
  'food',
  'dessert',
  'drink',
  'coffee',
  'tea_drink',
  'bubble_tea',
  'juice',
  'beer',
  'liquor',
  'cocktail',
  'wine',
  'red_wine',
  'white_wine',
  'sparkling_wine',
  'baked_goods',
  'bread',
  'white_bread',
  'bagel',
  'croissant',
  'pastry',
  'cake',
  'cake_regular',
  'birthday_cake',
  'cheesecake',
  'cupcake',
  'cookie',
  'donut',
  'waffle',
  'pancake',
  'ice_cream',
  'frozen_dessert',
  'fruitcake',
  'meat',
  'steak',
  'beef',
  'sausage',
  'meatball',
  'grill',
  'grilled_chicken',
  'fried_chicken',
  'fries',
  'hamburger',
  'hotdog',
  'pizza',
  'pasta',
  'sandwich',
  'salad',
  'taco',
  'kebab',
  'sushi',
  'ramen',
  'tempura',
  'dumpling',
  'soup',
  'rice',
  'curry',
  'seafood',
  'shellfish_prepared',
  'oatmeal',
  'scrambled_eggs',
  'fried_egg',
]);

// 라벨 → 대동명지도 가게 카테고리. 확실히 그 가게라고 할 수 있는 라벨만 둔다 (치킨·고기는 술집에서도 나와서 넓게 잡지 않는다)
const CATEGORY_BY_LABEL: Record<string, string> = {
  coffee: 'daedong-cafe',
  tea_drink: 'daedong-cafe',
  bubble_tea: 'daedong-cafe',
  juice: 'daedong-cafe',
  dessert: 'daedong-cafe',
  cake: 'daedong-cafe',
  cake_regular: 'daedong-cafe',
  birthday_cake: 'daedong-cafe',
  cheesecake: 'daedong-cafe',
  cupcake: 'daedong-cafe',
  cookie: 'daedong-cafe',
  donut: 'daedong-cafe',
  waffle: 'daedong-cafe',
  pancake: 'daedong-cafe',
  ice_cream: 'daedong-cafe',
  frozen_dessert: 'daedong-cafe',
  croissant: 'daedong-cafe',
  pastry: 'daedong-cafe',
  baked_goods: 'daedong-cafe',
  bagel: 'daedong-cafe',
  beer: 'daedong-bar',
  liquor: 'daedong-bar',
  cocktail: 'daedong-bar',
  wine: 'daedong-bar',
  red_wine: 'daedong-bar',
  white_wine: 'daedong-bar',
  sparkling_wine: 'daedong-bar',
  meat: 'daedong-meat',
  steak: 'daedong-meat',
  beef: 'daedong-meat',
  grill: 'daedong-meat',
  sushi: 'daedong-jp',
  ramen: 'daedong-jp',
  tempura: 'daedong-jp',
  dumpling: 'daedong-cn',
  pizza: 'daedong-western',
  pasta: 'daedong-western',
  hamburger: 'daedong-western',
  hotdog: 'daedong-western',
  sandwich: 'daedong-western',
  taco: 'daedong-western',
  rice: 'daedong-kr',
  soup: 'daedong-kr',
};

export function isFoodPhoto(labels: string[]) {
  return labels.some((label) => FOOD_LABELS.has(label));
}

// 사진들에 찍힌 음식으로 짐작한 가게 카테고리들
export function categoryHints(labelLists: string[][]) {
  return new Set(
    labelLists
      .flat()
      .map((label) => CATEGORY_BY_LABEL[label])
      .filter((category): category is string => category != null)
  );
}

// 붙어 있는 가게 후보 중 사진 음식과 맞는 카테고리만 남긴다. 맞는 곳이 없으면(짐작이 틀렸거나 라벨이 애매하면) 그대로 둔다
export function narrowCandidatesByFood<T extends { categoryCode: string }>(
  candidates: T[],
  hints: Set<string>
) {
  if (!hints.size) return candidates;
  const matched = candidates.filter((candidate) => hints.has(candidate.categoryCode));
  return matched.length ? matched : candidates;
}
