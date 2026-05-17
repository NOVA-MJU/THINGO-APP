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
