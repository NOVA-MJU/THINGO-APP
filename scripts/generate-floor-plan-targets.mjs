// 층별 안내도 SVG에서 텍스트 라벨(호실 코드, 시설명)의 원본 속성(transform, 글자 크기, 줄별 좌표)과 중심 좌표를 뽑아
// assets/map-floors/targets.json 으로 저장한다. 검색 결과 링크의 target 값으로 도면의 그 이름을 같은 자리에 강조색으로
// 다시 그리고(중심 좌표에는 핀) 표시할 때 쓴다. 방 모양(사각형·사다리꼴·곡선)과 무관하게 이름 위치를 기준으로 삼는다.
// 도면이 react-native-svg-transformer로 컴포넌트가 되어 런타임에는 SVG 원문을 읽을 수 없어서 미리 계산해 둔다.
// 도면 SVG를 추가하거나 다시 export하면 `node scripts/generate-floor-plan-targets.mjs`로 다시 생성한다.
// (export한 SVG의 첫 줄 캔버스 전체 배경 사각형 `<rect width=".." height=".." fill="#F5F7F9"/>`은 지우고 넣는다)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FLOORS_DIR = new URL('../assets/map-floors/', import.meta.url).pathname;
const OUTPUT_PATH = join(FLOORS_DIR, 'targets.json');

const IDENTITY = [1, 0, 0, 1, 0, 0];

function multiply([a1, b1, c1, d1, e1, f1], [a2, b2, c2, d2, e2, f2]) {
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

function rotation(degrees, cx = 0, cy = 0) {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotate = [cos, sin, -sin, cos, 0, 0];
  return multiply(multiply([1, 0, 0, 1, cx, cy], rotate), [1, 0, 0, 1, -cx, -cy]);
}

const TRANSFORM_BUILDERS = {
  translate: ([x = 0, y = 0]) => [1, 0, 0, 1, x, y],
  rotate: ([deg = 0, cx = 0, cy = 0]) => rotation(deg, cx, cy),
  scale: ([sx = 1, sy = sx]) => [sx, 0, 0, sy, 0, 0],
  matrix: (values) => values,
};

function parseTransform(value = '') {
  return [...value.matchAll(/(\w+)\(([^)]*)\)/g)].reduce((matrix, [, name, args]) => {
    const build = TRANSFORM_BUILDERS[name];
    if (!build) return matrix;
    return multiply(
      matrix,
      build(
        args
          .trim()
          .split(/[\s,]+/)
          .map(Number)
      )
    );
  }, IDENTITY);
}

function apply([a, b, c, d, e, f], x, y) {
  return [a * x + c * y + e, b * x + d * y + f];
}

function attr(source, name) {
  return source.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function decode(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// 검색 target(호실 코드나 장소명)과 비교할 때 쓰는 키: 공백·대소문자 차이를 없앤다
function normalizeLabel(text) {
  return text.replace(/\s+/g, '').toLowerCase();
}

// 라벨 중심 추정용 글자 폭 (Pretendard 기준 대략치): 한글 0.9em, 공백 0.3em, 영문·숫자 0.6em
function estimateTextWidth(text, fontSize) {
  return [...text].reduce((width, char) => {
    if (/\s/.test(char)) return width + 0.3 * fontSize;
    return width + (/[\u3131-\uD79D]/.test(char) ? 0.9 : 0.6) * fontSize;
  }, 0);
}

function parseLabels(svg) {
  return [...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].flatMap(([, attrs, body]) => {
    const tspans = [...body.matchAll(/<tspan\b([^>]*)>([^<]*)<\/tspan>/g)];
    const text = decode(tspans.map(([, , content]) => content).join(' ')).trim();
    if (!text || tspans.length === 0) return [];

    const fontSize = Number(attr(attrs, 'font-size') ?? 10);
    const transform = attr(attrs, 'transform');
    const [, firstAttrs, firstContent] = tspans[0];
    const startX = Number(attr(firstAttrs, 'x') ?? 0);
    const startY = Number(attr(firstAttrs, 'y') ?? 0);
    const textWidth = estimateTextWidth(decode(firstContent).trim(), fontSize);
    const localCenterX = startX + textWidth / 2;
    const localCenterY = startY - fontSize * 0.35;
    const matrix = parseTransform(transform);
    const [x, y] = apply(matrix, localCenterX, localCenterY);
    // 글자 영역의 위쪽 끝(viewBox y). 핀 끝을 여기 맞춰 이름을 가리지 않게 한다. 회전된(세로) 라벨도 있어 네 꼭짓점을 변환해 구한다
    const lineYs = tspans.map(([, tspanAttrs]) => Number(attr(tspanAttrs, 'y') ?? 0));
    const localTop = Math.min(...lineYs) - fontSize * 0.8;
    const localBottom = Math.max(...lineYs) + fontSize * 0.2;
    const top = Math.min(
      ...[
        [startX, localTop],
        [startX + textWidth, localTop],
        [startX, localBottom],
        [startX + textWidth, localBottom],
      ].map(([cornerX, cornerY]) => apply(matrix, cornerX, cornerY)[1])
    );
    const lines = tspans.map(([, tspanAttrs, content]) => [
      Number(attr(tspanAttrs, 'x') ?? 0),
      Number(attr(tspanAttrs, 'y') ?? 0),
      decode(content),
    ]);
    return [
      {
        text,
        center: [round(x), round(y)],
        top: round(top),
        transform,
        fontSize,
        fontWeight: attr(attrs, 'font-weight'),
        lines,
      },
    ];
  });
}

const round = (value) => Math.round(value * 10) / 10;

// 도면에 실제로 그려진 영역(viewBox 좌표의 [minX, minY, maxX, maxY]). 캔버스는 세로로 길고 층 모양은 가운데에 얇게 있어서,
// 건물 시트의 미리보기는 이 영역만 잘라 그린다. 경로(Figma export라 절대 좌표 M/L/H/V/C/Z만 쓴다)·사각형·선·글자 중심을 모은다.
// 곡선(C)은 조절점까지 포함해 실제보다 조금 넓을 수 있다
function contentBounds(svg, labels) {
  const points = labels.flatMap((label) => [label.center, [label.center[0], label.top]]);
  for (const [, d] of svg.matchAll(/<path\b[^>]*\bd="([^"]*)"/g)) {
    let x = 0;
    let y = 0;
    for (const [, command, args] of d.matchAll(/([MLHVCZ])([^MLHVCZ]*)/g)) {
      const values = args.trim()
        ? args
            .trim()
            .split(/[\s,]+/)
            .map(Number)
        : [];
      if (command === 'H') {
        for (const value of values) points.push([(x = value), y]);
      } else if (command === 'V') {
        for (const value of values) points.push([x, (y = value)]);
      } else {
        for (let i = 0; i + 1 < values.length; i += 2) {
          points.push([values[i], values[i + 1]]);
          [x, y] = [values[i], values[i + 1]];
        }
      }
    }
  }
  for (const [rect] of svg.matchAll(/<rect\b[^>]*>/g)) {
    const rx = Number(attr(rect, 'x') ?? 0);
    const ry = Number(attr(rect, 'y') ?? 0);
    const rw = Number(attr(rect, 'width') ?? 0);
    const rh = Number(attr(rect, 'height') ?? 0);
    const matrix = parseTransform(attr(rect, 'transform'));
    for (const [cx, cy] of [
      [rx, ry],
      [rx + rw, ry],
      [rx, ry + rh],
      [rx + rw, ry + rh],
    ]) {
      points.push(apply(matrix, cx, cy));
    }
  }
  for (const [line] of svg.matchAll(/<line\b[^>]*>/g)) {
    points.push([Number(attr(line, 'x1')), Number(attr(line, 'y1'))]);
    points.push([Number(attr(line, 'x2')), Number(attr(line, 'y2'))]);
  }
  const xs = points.map(([px]) => px);
  const ys = points.map(([, py]) => py);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(round);
}

function buildFloor(svg) {
  const [, , width, height] = attr(svg, 'viewBox').split(/\s+/).map(Number);
  // 캔버스 전체를 덮는 배경 사각형이 남아 있으면 그려진 영역이 캔버스 전체가 되므로 막는다 (배경은 화면 쪽 배경색으로 칠한다)
  if (new RegExp(`<rect width="${width}" height="${height}"`).test(svg)) {
    throw new Error('도면 SVG에서 캔버스 전체 배경 사각형을 지워야 한다');
  }
  const labels = parseLabels(svg);
  const targets = {};
  for (const { text, ...label } of labels) {
    const key = normalizeLabel(text);
    targets[key] = [...(targets[key] ?? []), label];
  }
  return { width, height, content: contentBounds(svg, labels), targets };
}

const result = {};
for (const buildingDir of readdirSync(FLOORS_DIR)
  .filter((name) => name.startsWith('building-'))
  .sort()) {
  const buildingId = buildingDir.replace('building-', '');
  result[buildingId] = {};
  for (const file of readdirSync(join(FLOORS_DIR, buildingDir))
    .filter((name) => name.endsWith('.svg'))
    .sort()) {
    const svg = readFileSync(join(FLOORS_DIR, buildingDir, file), 'utf8');
    result[buildingId][file.replace('.svg', '')] = buildFloor(svg);
  }
}

writeFileSync(OUTPUT_PATH, `${JSON.stringify(result)}\n`);
const floorCount = Object.values(result).reduce(
  (sum, floors) => sum + Object.keys(floors).length,
  0
);
process.stdout.write(`floor plan targets: ${floorCount} floors -> ${OUTPUT_PATH}` + '\n');
