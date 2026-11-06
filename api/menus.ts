import { client } from './client';

export type MenuCategory = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export type DailyMenu = {
  date: string;
  menuCategory: MenuCategory;
  meals: string[];
};

export type MenusResponse = {
  status: string;
  data: DailyMenu[];
  timestamp: string;
};

export async function getMenus(): Promise<MenusResponse> {
  const { data } = await client.get<MenusResponse>('/menus');
  return data;
}

export type MealRating = {
  menuCategory: MenuCategory;
  average: number;
  count: number;
  myScore: number | null;
};

type MealRatingResponse = {
  menuCategory: MenuCategory;
  average?: number | null;
  count?: number | null;
  myScore?: number | null;
};

function normalizeMealRating(raw: MealRatingResponse): MealRating {
  return {
    menuCategory: raw.menuCategory,
    average: raw.average ?? 0,
    count: raw.count ?? 0,
    myScore: raw.myScore ?? null,
  };
}

// date: yyyy-MM-dd
export async function getMealRatings(date: string): Promise<MealRating[]> {
  const { data } = await client.get<{ data: MealRatingResponse[] }>('/menus/ratings', {
    params: { date },
  });
  return data.data.map(normalizeMealRating);
}

// 날짜는 서버가 오늘(KST)로 정하므로 끼니와 점수만 보낸다
export async function rateMeal(menuCategory: MenuCategory, score: number): Promise<MealRating[]> {
  const { data } = await client.put<{ data: MealRatingResponse[] }>('/menus/ratings', {
    menuCategory,
    score,
  });
  return data.data.map(normalizeMealRating);
}
