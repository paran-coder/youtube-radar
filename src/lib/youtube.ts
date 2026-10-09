import type { Channel, Video, SearchCandidate } from './types';
import { channelIdentifier, parseDuration } from './utils';
const API = 'https://www.googleapis.com/youtube/v3/';
export class YoutubeApiError extends Error {constructor(message: string, public code = 0){super(message);this.name='YoutubeApiError';}}
function errMessage(status:number, reason?:string) {
 if(status===400 && reason==='keyInvalid') return 'API 키가 유효하지 않습니다. 설정을 확인해 주세요.';
 if(status===403 && ['quotaExceeded','dailyLimitExceeded','rateLimitExceeded'].includes(reason||'')) return 'API 할당량이 초과됐습니다. Google Cloud 할당량을 확인해 주세요.';
 if(status===403) return 'API 접근이 차단됐습니다. 키의 API 제한과 웹사이트 제한(HTTP 리퍼러)을 확인해 주세요.';
 if(status===400) return '요청이 잘못됐습니다. 채널 주소 또는 API 키를 확인해 주세요.';
 if(status===404) return '요청한 채널이나 영상이 존재하지 않습니다.';
 return `YouTube API 요청 실패 (${status}). 잠시 후 다시 시도해 주세요.`;
}
export async function apiGet<T>(key:string, endpoint:string, params:Record<string,string|number|undefined>,signal?:AbortSignal):Promise<T> {
 if(!key.trim()) throw new YoutubeApiError('먼저 설정에서 API 키를 입력해 주세요.');
 const url=new URL(API+endpoint);
 Object.entries(params).forEach(([k,v])=>{if(v!==undefined && v!=='' ) url.searchParams.set(k,String(v));});
 // Google requires the key as a query parameter for browser-side API key authentication.
 url.searchParams.set('key',key);
 let response:Response;
 try { response=await fetch(url.toString(), {signal,referrerPolicy:'strict-origin-when-cross-origin'}); }
 catch(e) {if((e as Error)?.name==='AbortError') throw e; throw new YoutubeApiError('네트워크 연결 또는 브라우저 API 접근 제한을 확인해 주세요.');}
 if(!response.ok){const body=await response.json().catch(()=>null);const reason=body?.error?.errors?.[0]?.reason as string|undefined;throw new YoutubeApiError(errMessage(response.status,reason),response.status);}
 return (await response.json()) as T;
}
type RawChannel = { id:string; snippet?:{title?:string;description?:string;customUrl?:string;country?:string;thumbnails?:{medium?:{url:string};default?:{url:string}}}; statistics?:{subscriberCount?:string;viewCount?:string;videoCount?:string;hiddenSubscriberCount?:boolean}; contentDetails?:{relatedPlaylists?:{uploads?:string}}; topicDetails?:{topicCategories?:string[]} };
type RawVideo = {id:string; snippet?:{channelId?:string;title?:string;description?:string;publishedAt?:string;categoryId?:string;thumbnails?:{medium?:{url:string};high?:{url:string};default?:{url:string}}}; statistics?:{viewCount?:string;likeCount?:string;commentCount?:string}; contentDetails?:{duration?:string}};
function parsePublicCount(v?:string):number|null {if(v===undefined) return null;const n=Number(v);return Number.isFinite(n)?n:null;}
function normalizeChannel(raw:RawChannel):Channel {return {id:raw.id,title:raw.snippet?.title||'이름 없는 채널',handle:raw.snippet?.customUrl,description:raw.snippet?.description||'',thumbnail:raw.snippet?.thumbnails?.medium?.url||raw.snippet?.thumbnails?.default?.url||'',subscriberCount:raw.statistics?.hiddenSubscriberCount?null:parsePublicCount(raw.statistics?.subscriberCount),viewCount:parsePublicCount(raw.statistics?.viewCount),videoCount:parsePublicCount(raw.statistics?.videoCount),uploadsId:raw.contentDetails?.relatedPlaylists?.uploads||'',topics:(raw.topicDetails?.topicCategories||[]).map(x=>{try {return decodeURIComponent(new URL(x).pathname.split('/').filter(Boolean).pop()||x).replaceAll('_',' ');}catch{return x;}}),country:raw.snippet?.country,fetchedAt:new Date().toISOString()};}
function normalizeVideo(raw:RawVideo,channelId:string):Video{return {id:raw.id,channelId,title:raw.snippet?.title||'제목 없음',description:raw.snippet?.description||'',thumbnail:raw.snippet?.thumbnails?.medium?.url||raw.snippet?.thumbnails?.high?.url||raw.snippet?.thumbnails?.default?.url||'',publishedAt:raw.snippet?.publishedAt||new Date().toISOString(),durationSeconds:parseDuration(raw.contentDetails?.duration||''),categoryId:raw.snippet?.categoryId||'',viewCount:parsePublicCount(raw.statistics?.viewCount),likeCount:parsePublicCount(raw.statistics?.likeCount),commentCount:parsePublicCount(raw.statistics?.commentCount),fetchedAt:new Date().toISOString()};}
const CHANNEL_PARTS='snippet,statistics,contentDetails,topicDetails';
export async function getChannel(key:string,input:string,signal?:AbortSignal):Promise<Channel>{
 const ident=channelIdentifier(input);let id=ident.id;
 if(!id && ident.search){const matches=await searchChannels(key,ident.search,5,signal);if(matches.length===0) throw new YoutubeApiError('검색 결과가 없습니다.');id=matches[0].id;}
 const params = id?{id}:{forHandle:ident.handle||input};
 const response=await apiGet<{items?:RawChannel[]}>(key,'channels',{part:CHANNEL_PARTS,...params},signal);
 const found=response.items?.[0];if(!found) throw new YoutubeApiError('채널을 찾을 수 없습니다. URL 또는 @핸들을 확인해 주세요.');
 return normalizeChannel(found);
}
export async function getChannelById(key:string,id:string,signal?:AbortSignal) {
 return getChannel(key,id,signal);
}
export async function searchChannels(key:string,query:string,max=10,signal?:AbortSignal):Promise<SearchCandidate[]>{
 const r=await apiGet<{items?:Array<{id?:{channelId?:string};snippet?:{title?:string;description?:string;channelId?:string;thumbnails?:{medium?:{url:string};default?:{url:string}}}}>}>(key,'search',{part:'snippet',type:'channel',q:query,regionCode:'KR',relevanceLanguage:'ko',maxResults:max},signal);
 return (r.items||[]).map(x=>({id:x.id?.channelId||x.snippet?.channelId||'',title:x.snippet?.title||'채널',description:x.snippet?.description||'',thumbnail:x.snippet?.thumbnails?.medium?.url||x.snippet?.thumbnails?.default?.url||''})).filter(x=>!!x.id);
}
export async function fetchRecentVideos(key:string,channel:Channel,limit=50,signal?:AbortSignal):Promise<Video[]>{
 if(!channel.uploadsId) throw new YoutubeApiError('이 채널에는 공개 업로드 재생목록이 없습니다.');
 const videoIds:string[]=[];let token:string|undefined;
 while(videoIds.length<limit){
  const r=await apiGet<{items?:Array<{contentDetails?:{videoId?:string};snippet?:{resourceId?:{videoId?:string}}}>;nextPageToken?:string}>(key,'playlistItems',{part:'contentDetails,snippet',playlistId:channel.uploadsId,maxResults:Math.min(50,limit-videoIds.length),pageToken:token},signal);
  videoIds.push(...(r.items||[]).map(x=>x.contentDetails?.videoId||x.snippet?.resourceId?.videoId||'').filter(Boolean));
  token=r.nextPageToken;if(!token||!(r.items||[]).length) break;
 }
 const vids:Video[]=[];
 for(let i=0;i<videoIds.length;i+=50){const r=await apiGet<{items?:RawVideo[]}>(key,'videos',{part:'snippet,statistics,contentDetails',id:videoIds.slice(i,i+50).join(',')},signal);vids.push(...(r.items||[]).map(x=>normalizeVideo(x,channel.id)));}
 return vids.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
}
export async function verifyApiKey(key:string){await apiGet(key,'videoCategories',{part:'snippet',regionCode:'KR'});}
