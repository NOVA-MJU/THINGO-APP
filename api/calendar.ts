import { client } from './client';

export type CalendarEvent = {
  id: number;
  startDate: string;
  endDate: string;
  description: string;
};

export type CalendarData = {
  year: number;
  month: number;
  all: CalendarEvent[];
  undergrad: CalendarEvent[];
  graduate: CalendarEvent[];
  holiday: CalendarEvent[];
};

type CalendarApiResponse = {
  status: string;
  data: CalendarData;
  timestamp: string;
};

export async function getCalendar(year: number, month: number): Promise<CalendarData> {
  const { data } = await client.get<CalendarApiResponse>('/calendar/monthly', {
    params: { year, month },
  });
  return data.data;
}
