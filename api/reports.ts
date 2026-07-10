import { client } from './client';

type ApiResponse<T> = {
  status: string;
  data: T;
  timestamp: string;
};

export type ReportTargetType = 'BOARD' | 'COMMENT' | 'REVIEW';

export type ReportReason =
  | 'COMMERCIAL_AD'
  | 'INAPPROPRIATE'
  | 'ABUSE'
  | 'OBSCENE'
  | 'PRIVACY_SCAM'
  | 'ETC';

export type CreateReportRequest = {
  targetType: ReportTargetType;
  targetUuid: string;
  reason: ReportReason;
  etcDetail?: string | null;
};

export type ReportDetail = {
  reportUuid: string;
  targetType: ReportTargetType;
  targetUuid: string;
  reason: ReportReason;
  reasonLabel: string;
  etcDetail: string | null;
  createdAt: string;
  message: string;
};

export async function createReport(body: CreateReportRequest): Promise<ReportDetail> {
  const { data } = await client.post<ApiResponse<ReportDetail>>('/reports', body);
  return data.data;
}
