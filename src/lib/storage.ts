import Dexie,{type Table} from 'dexie';
import { z } from 'zod';
import type { Channel, Video, Snapshot, Owner, Competitor, CompetitorRole, AppSettings, Backup } from './types';
import { expired } from './utils';
class RadarDatabase extends Dexie {
 channels!:Table<Channel,string>; videos!:Table<Video,string>; snapshots!:Table<Snapshot,string>;
 owners!:Table<Owner,string>; competitors!:Table<Competitor,string>; settings!:Table<AppSettings,string>;
 constructor(){super('youtube-radar-local-v1');this.version(1).stores({channels:'id, fetchedAt',videos:'id, channelId, publishedAt, fetchedAt',snapshots:'id, videoId, collectedAt',owners:'channelId, isPrimary',competitors:'id, ownerId, channelId',settings:'id'});}
}
export const db=new RadarDatabase();
export async function purgeExpired(){await db.transaction('rw',db.channels,db.videos,db.snapshots,async()=>{
 const channels=await db.channels.toArray();const old=channels.filter(c=>expired(c.fetchedAt));if(old.length) await db.channels.bulkDelete(old.map(c=>c.id));
 const videos=await db.videos.toArray();const out=videos.filter(v=>expired(v.fetchedAt));if(out.length) await db.videos.bulkDelete(out.map(v=>v.id));
 const snaps=await db.snapshots.toArray();const oldSnap=snaps.filter(s=>expired(s.collectedAt));if(oldSnap.length)await db.snapshots.bulkDelete(oldSnap.map(s=>s.id));
 });}
export async function saveChannelData(channel:Channel,videos:Video[]){
 await db.transaction('rw',db.channels,db.videos,db.snapshots,async()=>{
  await db.channels.put(channel);
  const prev=await db.videos.where('channelId').equals(channel.id).toArray();
  const overrides=new Map(prev.map(v=>[v.id,v.kindOverride]));
  const adjusted=videos.map(v=>({...v,kindOverride:overrides.get(v.id)}));
  if(adjusted.length) await db.videos.bulkPut(adjusted);
  // Keep the channel view aligned with the latest requested sample.
  // Remove snapshots for videos outside that sample as well.
  const freshIds=new Set(adjusted.map(v=>v.id));
  const removedIds=prev.filter(v=>!freshIds.has(v.id)).map(v=>v.id);
  if(removedIds.length){
   await db.videos.bulkDelete(removedIds);
   await db.snapshots.where('videoId').anyOf(removedIds).delete();
  }
  // Store new observations only for videos still in the sample.
  const when=new Date().toISOString();const snaps=adjusted.map(v=>({id:`${v.id}:${when}`,videoId:v.id,collectedAt:when,viewCount:v.viewCount}));
  if(snaps.length) await db.snapshots.bulkPut(snaps);
 });
 await purgeExpired();
}
export async function addOwner(channelId:string){await db.transaction('rw',db.owners,async()=>{const existing=await db.owners.get(channelId);if(existing)return;const owners=await db.owners.toArray();await db.owners.put({channelId,addedAt:new Date().toISOString(),isPrimary:!owners.some(x=>x.isPrimary)});});}
export async function primaryOwner(channelId:string){await db.transaction('rw',db.owners,async()=>{await db.owners.toCollection().modify({isPrimary:false});await db.owners.update(channelId,{isPrimary:true});});}
export async function removeOwner(channelId:string){await db.transaction('rw',db.owners,db.competitors,async()=>{const was=await db.owners.get(channelId);await db.owners.delete(channelId);await db.competitors.where('ownerId').equals(channelId).delete();if(was?.isPrimary){const next=(await db.owners.toArray()).sort((a,b)=>a.addedAt.localeCompare(b.addedAt))[0];if(next)await db.owners.update(next.channelId,{isPrimary:true});}});}
export async function addCompetitor(ownerId:string,channelId:string,role:CompetitorRole='direct'){if(ownerId===channelId)throw new Error('자신을 경쟁 채널로 추가할 수 없습니다.');const id=`${ownerId}:${channelId}`;const old=await db.competitors.get(id);await db.competitors.put({id,ownerId,channelId,addedAt:old?.addedAt??new Date().toISOString(),role});}
export async function setCompetitorRole(ownerId:string,channelId:string,role:CompetitorRole){await db.competitors.update(`${ownerId}:${channelId}`,{role});}
export async function exportBackup():Promise<Backup>{await purgeExpired();return {app:'youtube-radar',schemaVersion:'1.0.0',exportedAt:new Date().toISOString(),data:{channels:await db.channels.toArray(),videos:await db.videos.toArray(),snapshots:await db.snapshots.toArray(),owners:await db.owners.toArray(),competitors:await db.competitors.toArray(),settings:(await db.settings.toArray()).map(s=>({...s,rememberKey:false}))}};}
// Validate imported JSON, reject unknown application/schema and ignore API-like secrets.
const ChannelSchema=z.object({id:z.string().min(1),title:z.string(),description:z.string(),thumbnail:z.string(),subscriberCount:z.number().nullable(),viewCount:z.number().nullable(),videoCount:z.number().nullable(),uploadsId:z.string(),topics:z.array(z.string()),fetchedAt:z.string(),handle:z.string().optional(),country:z.string().optional()}).strip();
const VideoSchema=z.object({id:z.string().min(1),channelId:z.string().min(1),title:z.string(),description:z.string(),thumbnail:z.string(),publishedAt:z.string(),durationSeconds:z.number(),categoryId:z.string(),viewCount:z.number().nullable(),likeCount:z.number().nullable(),commentCount:z.number().nullable(),kindOverride:z.enum(['long','short']).optional(),fetchedAt:z.string()}).strip();
const BackupSchema=z.object({app:z.literal('youtube-radar'),schemaVersion:z.literal('1.0.0'),exportedAt:z.string(),data:z.object({channels:z.array(ChannelSchema).max(20000),videos:z.array(VideoSchema).max(500000),snapshots:z.array(z.object({id:z.string(),videoId:z.string(),collectedAt:z.string(),viewCount:z.number().nullable()}).strip()).max(1000000),owners:z.array(z.object({channelId:z.string(),addedAt:z.string(),isPrimary:z.boolean()}).strip()),competitors:z.array(z.object({id:z.string(),ownerId:z.string(),channelId:z.string(),addedAt:z.string(),role:z.enum(['direct','benchmark','inspiration']).optional()}).strip()),settings:z.array(z.object({id:z.string(),rememberKey:z.boolean().optional(),colorMode:z.enum(['light','dark']).optional()}).strip())}).strict()}).strict();
export async function importBackup(value:unknown,mode:'merge'|'replace'){
 const parsed=BackupSchema.parse(value);const d=parsed.data;
 await db.transaction('rw',[db.channels,db.videos,db.snapshots,db.owners,db.competitors,db.settings],async()=>{
  if(mode==='replace') {await Promise.all([db.channels.clear(),db.videos.clear(),db.snapshots.clear(),db.owners.clear(),db.competitors.clear(),db.settings.clear()]);}
  const ch=d.channels.filter(x=>!expired(x.fetchedAt));const vids=d.videos.filter(x=>!expired(x.fetchedAt));const snaps=d.snapshots.filter(x=>!expired(x.collectedAt));
  if(mode==='merge'){const olds=await db.channels.bulkGet(ch.map(c=>c.id));const keep=ch.filter((x,i)=>!olds[i]||Date.parse(x.fetchedAt)>=Date.parse(olds[i]!.fetchedAt));
   if(keep.length)await db.channels.bulkPut(keep);const oldvs=await db.videos.bulkGet(vids.map(v=>v.id));const keepvs=vids.filter((v,i)=>!oldvs[i]||Date.parse(v.fetchedAt)>=Date.parse(oldvs[i]!.fetchedAt));if(keepvs.length)await db.videos.bulkPut(keepvs);
  }else {if(ch.length)await db.channels.bulkPut(ch);if(vids.length)await db.videos.bulkPut(vids);}
  if(snaps.length)await db.snapshots.bulkPut(snaps);if(d.owners.length)await db.owners.bulkPut(d.owners);if(d.competitors.length)await db.competitors.bulkPut(d.competitors);
  if(d.settings.length)await db.settings.bulkPut(d.settings.map(s=>({...s,rememberKey:false})));
 });
 return {channels:d.channels.length,videos:d.videos.length,expired:d.channels.filter(x=>expired(x.fetchedAt)).length+d.videos.filter(x=>expired(x.fetchedAt)).length};
}
export async function resetAll(){await Promise.all([db.channels.clear(),db.videos.clear(),db.snapshots.clear(),db.owners.clear(),db.competitors.clear(),db.settings.clear()]);}
