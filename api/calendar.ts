import { client } from './client';
import type { StudentType } from './members';

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

// studentType을 보내면 그 대상(학생/대학원생) 일정과 공통 일정만 온다
export async function getCalendarDdays(
  limit = 4,
  studentType?: StudentType
): Promise<CalendarDday[]> {
  const { data } = await client.get<CalendarDdaysApiResponse>('/ddays', {
    params: { limit, studentType },
  });
  return data.data;
}
