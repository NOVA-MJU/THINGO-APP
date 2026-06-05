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

export type CalendarDdayPhase = 'UPCOMING' | 'ONGOING';

export type CalendarDday = {
  ddayValue: number;
  phase: CalendarDdayPhase;
  targetDate: string;
  startDate: string;
  endDate: string;
  eventName: string;
  eventNameTruncated: string;
  sourceType: string;
};

type CalendarApiResponse = {
  status: string;
  data: CalendarData;
  timestamp: string;
};

type CalendarDdaysApiResponse = {
  status: string;
  data: CalendarDday[];
  timestamp: string;
};

export async function getCalendar(year: number, month: number): Promise<CalendarData> {
  const { data } = await client.get<CalendarApiResponse>('/calendar/monthly', {
    params: { year, month },
  });
  return data.data;
}

export async function getCalendarDdays(limit = 4): Promise<CalendarDday[]> {
  const { data } = await client.get<CalendarDdaysApiResponse>('/ddays', {
    params: { limit },
  });
  return data.data;
}
