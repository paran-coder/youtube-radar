import type { Channel, Video, CompetitorRole } from './types';
import { kindOf, median } from './utils';

export const COMPETITOR_ROLES: { value: CompetitorRole; label: string; description: string }[] = [
  { value: 'direct', label: '직접 경쟁', description: '같은 시청자를 겨냥한 채널' },
  { value: 'benchmark', label: '성과 벤치마크', description: '규모와 무관하게 배울 성과가 있는 채널' },
  { value: 'inspiration', label: '콘텐츠 참고', description: '제목·형식·소재를 참고할 채널' },
];
export const roleLabel = (role?: CompetitorRole) => COMPETITOR_ROLES.find(x => x.value === role)?.label ?? '직접 경쟁';

export type Period = '30' | '90' | '180' | 'all';
export type KindFilter = 'all' | 'long' | 'short' | 'unknown';
export function selectVideos(videos: Video[], channelId: string, kind: KindFilter, period: Period, now = Date.now()): Video[] {
  return videos.filter(v => v.channelId === channelId && (kind === 'all' || kindOf(v) === kind) &&
    (period === 'all' || (Number.isFinite(Date.parse(v.publishedAt)) && Date.parse(v.publishedAt) <= now && now - Date.parse(v.publishedAt) <= Number(period) * 86400000)));
}
export function sampleStats(videos: Video[]) {
  const counts = videos.map(v => v.viewCount).filter((x): x is number => x !== null && Number.isFinite(x));
  const sorted = [...counts].sort((a, b) => b - a);
  const total = counts.reduce((sum, n) => sum + n, 0);
  const average = counts.length ? Math.round(total / counts.length) : null;
  const lastDate = videos.map(v => Date.parse(v.publishedAt)).filter(Number.isFinite);
  return {
    count: videos.length, validCounts: counts.length, average, median: median(counts),
    min: sorted.length ? sorted[sorted.length - 1] : null,
    max: sorted.length ? sorted[0] : null,
    top3Share: total > 0 ? (sorted.slice(0, 3).reduce((a, b) => a + b, 0) / total) * 100 : null,
    newest: lastDate.length ? Math.max(...lastDate) : null,
    oldest: lastDate.length ? Math.min(...lastDate) : null,
  };
}
export function comparisonWarnings(a: Video[], b: Video[], ca?: Channel, cb?: Channel): string[] {
  const warnings: string[] = [];
  const A = sampleStats(a); const B = sampleStats(b);
  if (Math.min(a.length, b.length) === 0) warnings.push('한 채널에 비교 조건에 맞는 영상이 없습니다. 기간이나 영상 유형을 변경하세요.');
  else if (Math.min(a.length, b.length) < 5) warnings.push('비교 영상이 5개 미만인 채널이 있습니다. 통계적 일반화를 피하세요.');
  else if (Math.min(a.length, b.length) < 10) warnings.push('한 채널의 표본이 10개 미만입니다. 조회수 분포를 함께 보세요.');
  if (Math.min(a.length, b.length) > 0 && Math.max(a.length, b.length) >= Math.min(a.length, b.length) * 2) warnings.push('채널 간 수집 표본 수가 두 배 이상 차이납니다. 평균만으로 우열을 판단하지 마세요.');
  if (A.top3Share !== null && A.top3Share > 70 || B.top3Share !== null && B.top3Share > 70) warnings.push('상위 3개 영상에 조회수가 집중된 채널이 있습니다. 평균과 중앙값을 함께 확인하세요.');
  if (ca && cb && Math.abs(Date.parse(ca.fetchedAt) - Date.parse(cb.fetchedAt)) > 86400000) warnings.push('두 채널의 마지막 수집 시각이 24시간 넘게 차이납니다. 최신 데이터를 수동 갱신해 주세요.');
  warnings.push('현재 조회수는 게시 후 누적값입니다. 같은 업로드 경과시간의 조회수가 아니며 클릭률·시청 지속시간도 알 수 없습니다.');
  return warnings;
}
export type TitlePatternId = 'question' | 'number' | 'compare' | 'guide' | 'warning';
export const TITLE_PATTERNS: { id: TitlePatternId; label: string; description: string; test: (title: string) => boolean }[] = [
  { id: 'question', label: '질문·호기심형', description: '물음표나 질문 표현', test: t => /[?？]|왜\b|어떻게|가능할까|뭘까|what|why|how/i.test(t) },
  { id: 'number', label: '숫자·목록형', description: '숫자나 순위 표현', test: t => /\d|TOP\s*\d|best\s+\d/i.test(t) },
  { id: 'compare', label: '비교·대결형', description: 'VS, 차이, 비교 표현', test: t => /\bvs\b|비교|차이|대결|versus|better|비슷한데|어느 쪽/i.test(t) },
  { id: 'guide', label: '방법·해결형', description: '방법, 팁, 가이드 표현', test: t => /방법|하는 법|가이드|꿀팁|팁\b|how to|tutorial|guide|tips/i.test(t) },
  { id: 'warning', label: '주의·문제형', description: '실수·주의·단점 표현', test: t => /주의|실수|단점|절대|후회|문제|mistake|avoid|warning|don't/i.test(t) },
];
export function analyzeTitlePatterns(videos: Video[]) {
  return TITLE_PATTERNS.map(pattern => ({
    id: pattern.id, label: pattern.label, description: pattern.description,
    count: videos.filter(v => pattern.test(v.title)).length,
    example: videos.find(v => pattern.test(v.title))?.title ?? '',
  }));
}
export function smallChannelHighlights(channels: Channel[], videos: Video[], kind: KindFilter, period: Period, now = Date.now()) {
  return channels.filter(c => c.subscriberCount !== null && c.subscriberCount <= 50000).flatMap(channel => {
    const sample = selectVideos(videos, channel.id, kind, period, now).filter(v => v.viewCount !== null);
    if (sample.length < 5) return [];
    const typical = median(sample.map(v => v.viewCount as number));
    if (!typical || typical === 0) return [];
    const best = [...sample].sort((a,b)=>(b.viewCount??0)-(a.viewCount??0))[0];
    if (!best || (best.viewCount ?? 0) <= typical) return [];
    return [{channel, video:best, typical, sampleCount:sample.length, ratio:(best.viewCount??0)/typical}];
  }).sort((a,b)=>b.ratio-a.ratio).slice(0,8);
}
export function contentCategoryGaps(base: Video[], competitive: Video[]) {
  if (!base.length) return [];
  const own = new Set(base.map(v=>v.categoryId).filter(Boolean));
  return Object.entries(competitive.reduce<Record<string,{count:number;channels:Set<string>}>>((acc,v)=>{
    if (!v.categoryId || own.has(v.categoryId)) return acc;
    const c=acc[v.categoryId]??{count:0,channels:new Set<string>()};c.count++;c.channels.add(v.channelId);acc[v.categoryId]=c;return acc;
  },{})).map(([id,x])=>({id,count:x.count,channels:x.channels.size})).sort((a,b)=>b.count-a.count).slice(0,8);
}
export function titleSuggestions(topic: string, sample: Video[]) {
  const safeTopic = topic.trim().replace(/\s+/g,' ').slice(0,72);
  if (!safeTopic) return [];
  const p = analyzeTitlePatterns(sample);
  const useComparison = (p.find(x=>x.id==='compare')?.count||0) > 0;
  return [
    `${safeTopic}, 직접 확인해봤습니다`,
    useComparison ? `${safeTopic} 비교: 실제 차이는 무엇일까?` : `${safeTopic}, 알아두면 좋은 핵심 5가지`,
    `${safeTopic}, 시작하기 전에 확인할 점 3가지`,
  ];
}
