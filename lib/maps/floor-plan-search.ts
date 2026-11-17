// 건물 시트의 호실 검색. 서버를 거치지 않고 앱에 들어 있는 층별 안내도 글자(assets/map-floors/targets.json)에서 찾는다.
// 도면 글자는 공백을 빼고 소문자로 바꾼 키로 모여 있고, 'S2111 / 소강당'처럼 두 줄인 이름은 's2111소강당' 한 키라서
// 코드('2111')로도 이름('소강당')으로도 찾히도록 키에 검색어가 들어 있는지로 본다

type FloorText = { lines: [number, number, string][] };
type FloorTargets = Record<string, { targets: Record<string, FloorText[]> }>;

export type FloorPlanSearchResult = {
  floorLabel: string;
  // 층별 안내도 화면의 target 파라미터로 넘기면 그 글자를 강조한다
  key: string;
  // 도면에 적힌 그대로 (두 줄이면 공백으로 잇는다)
  text: string;
};

export function normalizeFloorPlanQuery(query: string) {
  return query.replace(/\s+/g, '').toLowerCase();
}

export type BuildingFloorPlans = { buildingId: string; floors: FloorTargets; floorOrder: string[] };

export type BuildingFloorPlanSearchResult = FloorPlanSearchResult & { buildingId: string };

// 같은 층의 같은 이름(출입문·화장실 등)은 한 번만. 검색어로 시작하는 것 → 아래층부터 순서로
export function searchFloorPlanTexts(
  floors: FloorTargets,
  floorOrder: string[],
  query: string,
  limit = 20
): FloorPlanSearchResult[] {
  return withoutRank(rankFloorPlanTexts(floors, floorOrder, query).slice(0, limit));
}

// 여러 건물 도면에서 한 번에 찾는다. 건물 시트에서 다른 건물 호실(학생회관에서 '1353')을 쳤을 때 어느 건물인지 알려 주려고 쓴다.
// 순위는 건물을 가리지 않고 매기고, 순위가 같으면 넘긴 건물 순서대로
export function searchBuildingsFloorPlanTexts(
  buildings: BuildingFloorPlans[],
  query: string,
  limit = 20
): BuildingFloorPlanSearchResult[] {
  const ranked = buildings.flatMap(({ buildingId, floors, floorOrder }) =>
    rankFloorPlanTexts(floors, floorOrder, query).map((result) => ({ ...result, buildingId }))
  );
  return withoutRank(ranked.sort((a, b) => a.rank - b.rank).slice(0, limit));
}

function withoutRank<T extends { rank: number }>(results: T[]): Omit<T, 'rank'>[] {
  return results.map(({ rank: _rank, ...result }) => result);
}

function rankFloorPlanTexts(floors: FloorTargets, floorOrder: string[], query: string) {
  const normalized = normalizeFloorPlanQuery(query);
  if (!normalized) return [];

  const results: (FloorPlanSearchResult & { rank: number })[] = [];
  floorOrder.forEach((floorLabel, floorIndex) => {
    const targets = floors[floorLabel]?.targets ?? {};
    for (const [key, texts] of Object.entries(targets)) {
      const at = key.indexOf(normalized);
      if (at === -1) continue;
      // 'S1353'을 '1353'으로 찾는 경우처럼 호실 코드 앞 글자 하나(S)는 시작으로 친다
      const startsWith = at === 0 || (at === 1 && /^[a-z]\d/.test(key));
      const text = texts[0].lines
        .map(([, , content]) => content.trim())
        .filter(Boolean)
        .join(' ');
      results.push({ floorLabel, key, text, rank: (startsWith ? 0 : 1000) + floorIndex });
    }
  });
  return results.sort((a, b) => a.rank - b.rank);
}

// 'B2','B1','F1','F2'... 아래층부터 (도면 파일 순서는 F10이 F1 다음에 오는 등 뒤섞여 있다)
export function sortFloorLabels(labels: string[]) {
  const level = (label: string) => {
    const number = Number(label.slice(1));
    return label.startsWith('B') ? -number : number;
  };
  return [...labels].sort((a, b) => level(a) - level(b));
}
