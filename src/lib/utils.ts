import type { Video, VideoKind } from './types';
export const MAX_DATA_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const expired = (date: string, now = Date.now()) => !Number.isFinite(Date.parse(date)) || now - Date.parse(date) > MAX_DATA_AGE_MS;
export function parseDuration(value: string): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!m) return 0;
  return Number(m[1] || 0)*86400 + Number(m[2] || 0)*3600 + Number(m[3] || 0)*60 + Number(m[4] || 0);
}
export function kindOf(v: Video): VideoKind { return v.kindOverride ?? (v.durationSeconds > 180 ? 'long' : 'unknown'); }
export function prettyNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '비공개';
  if (Math.abs(value)>=100000000) return `${parseFloat((value/100000000).toFixed(1))}억`;
  if (Math.abs(value)>=10000) return `${parseFloat((value/10000).toFixed(1))}만`;
  return value.toLocaleString('ko-KR');
}
export const numberLabel = (n: number | null | undefined) => n == null ? '정보 없음' : n.toLocaleString('ko-KR');
export const dateLabel = (date?:string) => date ? new Date(date).toLocaleDateString('ko-KR',{year:'numeric',month:'short',day:'numeric'}) : '없음';
export const timeLabel = (date?:string) => date ? new Date(date).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '없음';
export function durationLabel(n: number) {const h=Math.floor(n/3600);const m=Math.floor((n%3600)/60);const s=Math.floor(n%60); return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;}
export function median(values: number[]) { if (!values.length) return null; const sorted=[...values].sort((a,b)=>a-b); const m=Math.floor(sorted.length/2); return sorted.length%2 ? sorted[m] : (sorted[m-1]+sorted[m])/2; }
export function channelIdentifier(text: string): { id?: string; handle?: string; search?: string } {
  const t=text.trim(); if (!t) return {};
  let parsed=t;
  try {const u=new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`); if (/(^|\.)youtube\.com$/.test(u.hostname) || u.hostname==='www.youtube.com') {
    const p=u.pathname.split('/').filter(Boolean);
    if (p[0]==='channel' && /^UC[\w-]{20,}$/.test(p[1]||'')) return {id:p[1]};
    if (p[0]?.startsWith('@')) return {handle:decodeURIComponent(p[0])};
    parsed=p.length ? p[p.length-1] : t;
  }}catch { /* input may be a simple name */ }
  if (/^UC[\w-]{20,}$/.test(t)) return {id:t};
  if (/^@[\w.\-\p{L}\p{N}]+$/u.test(t)) return {handle:t};
  return {search:parsed};
}
export const categories: Record<string,string> = {'1':'영화·애니메이션','2':'자동차·교통','10':'음악','15':'동물·반려동물','17':'스포츠','18':'단편 영화','19':'여행·이벤트','20':'게임','21':'비디오 블로그','22':'인물·블로그','23':'코미디','24':'엔터테인먼트','25':'뉴스·정치','26':'노하우·스타일','27':'교육','28':'과학기술','29':'비영리·사회운동','30':'영화','31':'애니메이션','32':'액션·모험','33':'클래식','34':'코미디','35':'다큐멘터리','36':'드라마','37':'가족','38':'해외','39':'호러','40':'SF·판타지','41':'스릴러','42':'단편','43':'쇼','44':'예고편'};
export const labelForCategory = (id:string) => categories[id] ?? `카테고리 ${id||'미지정'}`;
export const sortByViews = (arr:Video[]) => [...arr].sort((a,b)=>(b.viewCount ?? -1) -(a.viewCount ?? -1));
