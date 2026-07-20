import { client } from './client';

export type ReportReason =
  | 'COMMERCIAL_AD'
  | 'INAPPROPRIATE'
  | 'ABUSE'
  | 'OBSCENE'
  | 'PRIVACY_SCAM'
  | 'ETC';

type ReportTargetType = 'BOARD';

type CreateReportRequest = {
  targetType: ReportTargetType;
  targetUuid: string;
  reason: ReportReason;
  etcDetail: string | null;
};

// 게시글 신고
export async function reportBoard(
  boardUUID: string,
  reason: ReportReason,
  etcDetail?: string
): Promise<void> {
  const body: CreateReportRequest = {
    targetType: 'BOARD',
    targetUuid: boardUUID,
    reason,
    etcDetail: reason === 'ETC' ? (etcDetail ?? null) : null,
  };

  await client.post('/reports', body);
}
