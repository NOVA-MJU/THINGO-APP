import apiClient from './apiClient';

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
  timestamp: string;
}

export type MenuCategory = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export interface MenuItem {
  date: string;
  menuCategory: MenuCategory;
  meals: string[];
}

export const getMenus = async (): Promise<MenuItem[]> => {
  if (__DEV__) {
    // console.log("[menus/api] GET /menus 요청 시작");
  }

  try {
    const res = await apiClient.get<ApiResponse<MenuItem[]>>('/menus');

    if (__DEV__) {
      // console.log("[menus/api] GET /menus 응답 성공", {
      //   status: res.status,
      //   apiStatus: res.data.status,
      //   count: res.data.data.length,
      //   firstItem: res.data.data[0],
      // });
    }

    return res.data.data;
  } catch (error) {
    if (__DEV__) {
      console.error('[menus/api] GET /menus 응답 실패', error);
    }

    throw error;
  }
};
