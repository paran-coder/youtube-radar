import { describe, it, expect } from 'vitest';
import { analyzeTitlePatterns, comparisonWarnings, contentCategoryGaps, sampleStats, selectVideos, smallChannelHighlights, titleSuggestions, roleLabel } from '../src/lib/competition';
import type { Channel, Video } from '../src/lib/types';
const now=Date.parse('2026-10-09T00:00:00Z');
const channel=(id:string,subscriberCount:number):Channel=>({id,title:id,description:'',thumbnail:'',subscriberCount,viewCount:null,videoCount:null,uploadsId:'',topics:[],fetchedAt:new Date(now).toISOString()});
const video=(id:string,channelId:string,viewCount:number,daysAgo=3,title='비교 3가지'):Video=>({id,channelId,title,description:'',thumbnail:'',publishedAt:new Date(now-daysAgo*86400000).toISOString(),durationSeconds:600,categoryId:'28',viewCount,likeCount:null,commentCount:null,fetchedAt:new Date(now).toISOString()});
describe('경쟁 분석 로컬 계산',()=>{
 it('최근 90일만 필터하고 영상 종류를 구분한다',()=>{const v=[video('1','A',20),video('2','A',30,100),{...video('3','A',10),kindOverride:'short' as const},video('4','B',40)]; expect(selectVideos(v,'A','long','90',now).map(x=>x.id)).toEqual(['1']); expect(selectVideos(v,'A','short','90',now).map(x=>x.id)).toEqual(['3']);});
 it('표본, 평균, 중앙값, 상위 3개 집중도를 계산한다',()=>{const s=sampleStats([video('a','A',100),video('b','A',200),video('c','A',300),video('d','A',400)]);expect(s.average).toBe(250);expect(s.median).toBe(250);expect(s.top3Share).toBe(90);});
 it('표본 크기와 수집 시각 경고를 제공한다',()=>{const a=[video('a','A',100)],b=Array.from({length:6},(_,i)=>video(String(i),'B',100));const old={...channel('B',300),fetchedAt:new Date(now-3*86400000).toISOString()};const out=comparisonWarnings(a,b,channel('A',200),old);expect(out.some(x=>x.includes('5개 미만'))).toBe(true);expect(out.some(x=>x.includes('두 배'))).toBe(true);expect(out.some(x=>x.includes('24시간'))).toBe(true);});
 it('숨은 강자는 채널별 대표 영상만, 최소 5개 표본으로 제한한다',()=>{const a=[100,100,100,200,1200].map((n,i)=>video('a'+i,'A',n));const b=[900,100,100].map((n,i)=>video('b'+i,'B',n));const results=smallChannelHighlights([channel('A',1000),channel('B',500),channel('C',100000)], [...a,...b], 'all','90',now);expect(results.length).toBe(1);expect(results[0].video.id).toBe('a4');expect(results[0].ratio).toBe(12);});
 it('제목 패턴은 중복 유형을 허용한다',()=>{const patterns=analyzeTitlePatterns([video('a','A',1,2,'가격 비교 TOP 3?'),video('b','A',1,2,'시작하는 방법')]);expect(patterns.find(x=>x.id==='question')?.count).toBe(1);expect(patterns.find(x=>x.id==='number')?.count).toBe(1);expect(patterns.find(x=>x.id==='compare')?.count).toBe(1);expect(patterns.find(x=>x.id==='guide')?.count).toBe(1);});
 it('콘텐츠 공백은 공식 카테고리에서만 확인한다',()=>{const res=contentCategoryGaps([video('a','A',1)],[{...video('b','B',1),categoryId:'27'},video('c','B',1)]);expect(res).toEqual([{id:'27',count:1,channels:1}]);});
 it('제목 제안은 주제를 입력해야 생성된다',()=>{expect(titleSuggestions(' ',[])).toEqual([]);expect(titleSuggestions('스마트폰 가격',[video('a','A',10)])).toHaveLength(3);});
 it('기존 저장된 경쟁 채널은 직접 경쟁으로 취급한다',()=>expect(roleLabel(undefined)).toBe('직접 경쟁'));
});
