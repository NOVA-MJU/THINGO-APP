import { Text } from '@/components/ui/text';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

// 과목 목록처럼 긴 항목은 두 줄까지만 보이고 '더보기'로 펼친다
const COLLAPSED_LINES = 2;
const COLLAPSE_MIN_LENGTH = 60;

type SummaryBlock =
  | { kind: 'text'; text: string }
  | { kind: 'item'; title: string; body: string[] };

// AI 요약 문자열을 문단과 항목으로 나눈다.
// '- '로 시작하면 항목 제목, 그 뒤 두 칸 들여쓴 줄은 그 항목의 본문이다 (학기교 답: '- 2018~2024학번 (12학점)' + 과목 줄)
function parseSummary(summary: string): SummaryBlock[] {
  const blocks: SummaryBlock[] = [];
  for (const line of summary.split('\n')) {
    if (!line.trim()) continue;
    const last = blocks[blocks.length - 1];
    if (line.startsWith('  ') && last?.kind === 'item') {
      last.body.push(line.trim());
    } else if (line.startsWith('- ')) {
      blocks.push({ kind: 'item', title: line.slice(2).trim(), body: [] });
    } else {
      blocks.push({ kind: 'text', text: line.trim() });
    }
  }
  return blocks;
}

export default function AiSummaryText({ summary }: { summary: string }) {
  const blocks = React.useMemo(() => parseSummary(summary), [summary]);

  return (
    <View className="gap-1.5">
      {blocks.map((block, index) =>
        block.kind === 'text' ? (
          <Text key={index} className="text-grey-80 text-body05">
            {block.text}
          </Text>
        ) : (
          <SummaryItem key={index} title={block.title} body={block.body} />
        )
      )}
    </View>
  );
}

function SummaryItem({ title, body }: { title: string; body: string[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const bodyText = body.join('\n');
  const collapsible = bodyText.length > COLLAPSE_MIN_LENGTH;

  return (
    <View className="flex-row gap-1.5">
      <Text className="text-grey-40 text-body05">•</Text>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className={body.length > 0 ? 'text-black text-body04' : 'text-grey-80 text-body05'}>
          {title}
        </Text>
        {body.length > 0 ? (
          <Text
            className="text-grey-60 text-body05"
            numberOfLines={collapsible && !expanded ? COLLAPSED_LINES : undefined}
          >
            {bodyText}
          </Text>
        ) : null}
        {collapsible ? (
          <TouchableOpacity onPress={() => setExpanded((value) => !value)} hitSlop={6}>
            <Text className="text-blue-35 text-caption02">{expanded ? '접기' : '더보기'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
