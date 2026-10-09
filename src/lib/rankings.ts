import type { Snapshot, Video } from './types';

/** Only browser-saved videos are ranked; this is never a global YouTube chart. */
export type DashboardScope = 'all' | 'mine' | 'competitors';
export type DashboardPeriod = '30' | '90' | 'all';
export type ObservedGrowth = {
  video: Video;
  deltaViews: number;
  viewsPerHour: number;
  hours: number;
  from: string;
  to: string;
};
const DAY = 86_400_000;
const HOUR = 3_600_000;

export function dashboardSelection(
  videos: Video[], scope: DashboardScope, period: DashboardPeriod,
  ownerId: string | undefined, competitorIds: ReadonlySet<string>, now = Date.now(),
): Video[] {
  return videos.filter(v => {
    if (scope === 'mine' && (!ownerId || v.channelId !== ownerId)) return false;
    if (scope === 'competitors' && !competitorIds.has(v.channelId)) return false;
    if (period === 'all') return true;
    const uploaded = Date.parse(v.publishedAt);
    return Number.isFinite(uploaded) && uploaded <= now && now - uploaded <= Number(period) * DAY;
  });
}

export function topViewed(videos: Video[], limit = 4): Video[] {
  return videos.filter(v => v.viewCount !== null && Number.isFinite(v.viewCount))
    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/**
 * Observed growth, not predicted growth or YouTube's official 'trending' ranking.
 * Compare the latest observation with the most recent earlier one at least 1h apart.
 * Restrict to 30d retention and require the latest observation to be <= 7d old.
 */
export function risingObserved(
  videos: Video[], snapshots: Snapshot[], now = Date.now(), limit = 4,
): ObservedGrowth[] {
  const selected = new Set(videos.map(v => v.id));
  const byVideo = new Map<string, {time: number; value: number; raw: Snapshot}[]>();
  for (const snap of snapshots) {
    if (!selected.has(snap.videoId) || snap.viewCount === null || !Number.isFinite(snap.viewCount) || snap.viewCount < 0) continue;
    const t = Date.parse(snap.collectedAt);
    if (!Number.isFinite(t) || t > now || now - t > 30 * DAY) continue;
    const arr = byVideo.get(snap.videoId) ?? [];
    arr.push({time:t, value:snap.viewCount, raw:snap});
    byVideo.set(snap.videoId, arr);
  }
  const ranked: ObservedGrowth[] = [];
  for (const video of videos) {
    const points = byVideo.get(video.id)?.sort((a,b) => b.time - a.time) ?? [];
    const current = points[0];
    if (!current || now - current.time > 7 * DAY) continue;
    const prior = points.find(p => current.time - p.time >= HOUR);
    if (!prior || current.value < prior.value) continue;
    const hours = (current.time - prior.time) / HOUR;
    const deltaViews = current.value - prior.value;
    ranked.push({video, deltaViews, hours, viewsPerHour:deltaViews / hours,
      from:prior.raw.collectedAt, to:current.raw.collectedAt});
  }
  return ranked.sort((a,b) => b.viewsPerHour - a.viewsPerHour || b.deltaViews - a.deltaViews || a.video.id.localeCompare(b.video.id)).slice(0, limit);
}
