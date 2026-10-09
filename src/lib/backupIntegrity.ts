import type { Backup, Owner, AppSettings } from './types';
import { expired } from './utils';

export type BackupData = Backup['data'];
export interface ImportReport {
  channelsAdded: number; channelsUpdated: number;
  videosAdded: number; videosUpdated: number;
  snapshotsAdded: number; ownersAdded: number; competitorsAdded: number;
  skippedExpired: number; skippedUnlinked: number; skippedOlder: number;
  totalChannels: number; totalVideos: number;
}

const timestamp = (date: string) => Date.parse(date);
function isCurrent(date: string, now: number): boolean {
  return Number.isFinite(timestamp(date)) && timestamp(date) <= now && !expired(date, now);
}
const newest = <T extends {id:string}>(rows:T[], getTime:(item:T)=>number):T[] => {
  const map = new Map<string,T>();
  for (const row of rows) {
    const old=map.get(row.id);
    if (!old || getTime(row)>=getTime(old)) map.set(row.id,row);
  }
  return [...map.values()];
};
function pickLatest<T extends {id:string;fetchedAt:string}>(existing:T[], incoming:T[], mode:'merge'|'replace') {
  const combined=mode==='replace'?incoming:[...existing,...incoming];
  return newest(combined, x=>timestamp(x.fetchedAt));
}
function normalizeOwners(owners:Owner[], existingPrimary:string|undefined):Owner[] {
  const unique=new Map<string,Owner>();
  for (const owner of owners) if (!unique.has(owner.channelId)) unique.set(owner.channelId,owner);
  const all=[...unique.values()].sort((a,b)=>a.addedAt.localeCompare(b.addedAt)||a.channelId.localeCompare(b.channelId));
  const primary=all.find(o=>o.channelId===existingPrimary)||all.find(o=>o.isPrimary)||all[0];
  return all.map(o=>({...o,isPrimary:o.channelId===primary?.channelId}));
}
/**
 * Plan a JSON import without mutating the browser database. All persisted tables are
 * written within one IndexedDB transaction by the caller. This keeps backup imports
 * idempotent and prevents NEW orphan references from entering the database.
 * Existing manually curated relationships may survive missing/expired metadata,
 * and are intentionally preserved to avoid silently deleting users' saved groups.
 */
export function prepareBackupImport(input:BackupData, existing:BackupData, mode:'merge'|'replace', now=Date.now()):{data:BackupData;report:ImportReport} {
  let skippedExpired=0,skippedUnlinked=0,skippedOlder=0;
  const channelsIn=input.channels.filter(c=>isCurrent(c.fetchedAt,now)||(skippedExpired++,false));
  const videosIn=input.videos.filter(v=>isCurrent(v.fetchedAt,now)||(skippedExpired++,false));
  const snapshotsIn=input.snapshots.filter(s=>isCurrent(s.collectedAt,now)||(skippedExpired++,false));

  const existingChannels=mode==='merge'?existing.channels.filter(c=>isCurrent(c.fetchedAt,now)):[];
  const channels=pickLatest(existingChannels,channelsIn,mode);
  const channelIds=new Set(channels.map(c=>c.id));
  const relatedVideos=videosIn.filter(v=>channelIds.has(v.channelId)||(skippedUnlinked++,false));
  const oldVideos=mode==='merge'?existing.videos.filter(v=>isCurrent(v.fetchedAt,now)):[];
  const videos=pickLatest(oldVideos,relatedVideos,mode).filter(v=>channelIds.has(v.channelId));
  const videoIds=new Set(videos.map(v=>v.id));
  const relatedSnaps=snapshotsIn.filter(s=>videoIds.has(s.videoId)||(skippedUnlinked++,false));
  const oldSnaps=mode==='merge'?existing.snapshots.filter(s=>isCurrent(s.collectedAt,now)):[];
  const snapshots=newest([...oldSnaps,...relatedSnaps].filter(s=>videoIds.has(s.videoId)),s=>timestamp(s.collectedAt));

  const existingOwners=mode==='merge'?existing.owners:[];
  const existingOwnerIds=new Set(existingOwners.map(o=>o.channelId));
  const acceptedOwners=input.owners.filter(o=>channelIds.has(o.channelId)||(skippedUnlinked++,false));
  const incomingOwners=[...new Map(acceptedOwners.filter(o=>!existingOwnerIds.has(o.channelId)).map(o=>[o.channelId,o])).values()];
  const owners=normalizeOwners([...existingOwners,...incomingOwners],existingOwners.find(o=>o.isPrimary)?.channelId);
  const ownerIds=new Set(owners.map(o=>o.channelId));

  const oldLinks=mode==='merge'?existing.competitors:[];
  const linkIds=new Set(oldLinks.map(c=>c.id));
  const acceptedLinks=input.competitors.filter(c=>{
    const ok=c.id===`${c.ownerId}:${c.channelId}`&&c.ownerId!==c.channelId&&ownerIds.has(c.ownerId)&&channelIds.has(c.channelId);
    if(!ok)skippedUnlinked++;
    return ok;
  });
  const addedLinks=[...new Map(acceptedLinks.filter(c=>!linkIds.has(c.id)).map(c=>[c.id,c])).values()];
  const competitors=[...oldLinks,...addedLinks];
  const oldSettings=mode==='merge'?existing.settings:[];
  const settingsById=new Map<string,AppSettings>();
  for(const setting of [...input.settings,...oldSettings])settingsById.set(setting.id,{...setting,rememberKey:false});
  const settings=[...settingsById.values()];

  const oldChById=new Map(existingChannels.map(c=>[c.id,c]));
  const oldVById=new Map(oldVideos.map(v=>[v.id,v]));
  const updatedCh=channels.filter(c=>oldChById.has(c.id)&&c!==oldChById.get(c.id)).length;
  const updatedVid=videos.filter(v=>oldVById.has(v.id)&&v!==oldVById.get(v.id)).length;
  for (const c of channelsIn) if(mode==='merge'&&oldChById.has(c.id)&&timestamp(c.fetchedAt)<timestamp(oldChById.get(c.id)!.fetchedAt))skippedOlder++;
  for (const v of relatedVideos) if(mode==='merge'&&oldVById.has(v.id)&&timestamp(v.fetchedAt)<timestamp(oldVById.get(v.id)!.fetchedAt))skippedOlder++;
  const oldSnapshotIds=new Set(oldSnaps.map(s=>s.id));
  const report:ImportReport={
    channelsAdded:channels.filter(c=>!oldChById.has(c.id)).length,
    channelsUpdated:updatedCh,
    videosAdded:videos.filter(v=>!oldVById.has(v.id)).length,
    videosUpdated:updatedVid,
    snapshotsAdded:snapshots.filter(s=>!oldSnapshotIds.has(s.id)).length,
    ownersAdded:incomingOwners.length,competitorsAdded:addedLinks.length,
    skippedExpired,skippedUnlinked,skippedOlder,
    totalChannels:channels.length,totalVideos:videos.length,
  };
  return {data:{channels,videos,snapshots,owners,competitors,settings},report};
}
