export type VideoKind = 'long' | 'short' | 'unknown';
export interface Channel {
  id: string; title: string; handle?: string; description: string; thumbnail: string;
  subscriberCount: number | null; viewCount: number | null; videoCount: number | null;
  uploadsId: string; topics: string[]; country?: string; fetchedAt: string;
}
export interface Video {
  id: string; channelId: string; title: string; description: string; thumbnail: string;
  publishedAt: string; durationSeconds: number; categoryId: string;
  viewCount: number | null; likeCount: number | null; commentCount: number | null;
  kindOverride?: 'long' | 'short'; fetchedAt: string;
}
export interface Snapshot { id: string; videoId: string; collectedAt: string; viewCount: number | null; }
export interface Owner { channelId: string; addedAt: string; isPrimary: boolean; }
export interface Competitor { id: string; ownerId: string; channelId: string; addedAt: string; }
export interface AppSettings { id: string; rememberKey?: boolean; colorMode?: 'light' | 'dark'; }
export interface Backup { app: 'youtube-radar'; schemaVersion: '1.0.0'; exportedAt: string; data: { channels: Channel[]; videos: Video[]; snapshots: Snapshot[]; owners: Owner[]; competitors: Competitor[]; settings: AppSettings[] } }
export interface SearchCandidate { id: string; title: string; description: string; thumbnail: string; handle?: string; }
export type Page = 'dashboard' | 'search' | 'channel' | 'owners' | 'discover' | 'compare' | 'library' | 'settings' | 'api-guide';
