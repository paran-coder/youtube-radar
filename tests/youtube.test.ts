import {beforeEach,describe,expect,it,vi} from 'vitest';
import {getChannel,fetchRecentVideos,searchChannels,YoutubeApiError} from '../src/lib/youtube';
beforeEach(()=>{vi.restoreAllMocks();});
describe('YouTube API 연결',()=>{
 it('핸들로 채널을 조회하고 공개 데이터를 정규화한다',async()=>{
  const mock=vi.fn(async(_input:string)=>({ok:true,json:async()=>({items:[{id:'UC1234567890123456789012',snippet:{title:'테스트 채널',thumbnails:{default:{url:'https://example.com/a.png'}}},statistics:{subscriberCount:'21000',viewCount:'90000',videoCount:'100'},contentDetails:{relatedPlaylists:{uploads:'UU123'}}}]})}));vi.stubGlobal('fetch',mock);
  const c=await getChannel('some-key','@example');expect(c.title).toBe('테스트 채널');expect(c.subscriberCount).toBe(21000);expect(c.uploadsId).toBe('UU123');expect(new URL(mock.mock.calls[0][0] as unknown as string).searchParams.get('forHandle')).toBe('@example');
 });
 it('검색 결과는 한국어 관련성 옵션으로 조회한다',async()=>{const mock=vi.fn(async(_input:string)=>({ok:true,json:async()=>({items:[]})}));vi.stubGlobal('fetch',mock);expect(await searchChannels('key','요리')).toEqual([]);expect(new URL(mock.mock.calls[0][0] as unknown as string).searchParams.get('relevanceLanguage')).toBe('ko');});
 it('영상 누락 통계는 null, 재생시간은 초로 저장한다',async()=>{
  const mock=vi.fn(async(input:string)=>{const url=new URL(input);return {ok:true,json:async()=>url.pathname.endsWith('playlistItems')?({items:[{contentDetails:{videoId:'VID1'}}]}):({items:[{id:'VID1',snippet:{title:'영상',publishedAt:'2026-10-01T00:00:00Z',categoryId:'28'},statistics:{viewCount:'1000'},contentDetails:{duration:'PT2M'}}]})};});vi.stubGlobal('fetch',mock);
  const videos=await fetchRecentVideos('key',{id:'UC',title:'T',description:'',thumbnail:'',subscriberCount:1,viewCount:2,videoCount:3,uploadsId:'UU1',topics:[],fetchedAt:'2026-10-09T00:00:00Z'});
  expect(videos).toHaveLength(1);expect(videos[0].durationSeconds).toBe(120);expect(videos[0].likeCount).toBeNull();expect(mock).toHaveBeenCalledTimes(2);
 });
 it('API 에러에서 비밀 키를 사용자 메시지에 노출하지 않는다',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,status:403,json:async()=>({error:{errors:[{reason:'quotaExceeded'}]}})})));await expect(getChannel('secret-key','@test')).rejects.toThrow(YoutubeApiError);});
});
