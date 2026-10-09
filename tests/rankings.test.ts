import {describe,it,expect} from 'vitest';
import {dashboardSelection,risingObserved,topViewed} from '../src/lib/rankings';
import type {Snapshot,Video} from '../src/lib/types';
const now=Date.parse('2026-10-09T12:00:00Z');
const day=86_400_000;
const video=(id:string,channelId:string,days=2,views:number|null=100):Video=>({id,channelId,title:id,description:'',thumbnail:'',publishedAt:new Date(now-days*day).toISOString(),durationSeconds:200,categoryId:'28',viewCount:views,likeCount:2,commentCount:1,fetchedAt:new Date(now).toISOString()});
const snap=(id:string,hoursAgo:number,views:number|null):Snapshot=>({id:`${id}-${hoursAgo}`,videoId:id,collectedAt:new Date(now-hoursAgo*3_600_000).toISOString(),viewCount:views});
describe('대시보드 영상 범위 및 관측 급상승',()=>{
 it('모든 채널 기본은 저장된 모든 영상이며 내 채널/경쟁은 정확히 구분',()=>{const vs=[video('a','mine'),video('b','comp'),video('c','other')];const comp=new Set(['comp']);expect(dashboardSelection(vs,'all','all','mine',comp,now)).toHaveLength(3);expect(dashboardSelection(vs,'mine','all','mine',comp,now).map(v=>v.id)).toEqual(['a']);expect(dashboardSelection(vs,'competitors','all','mine',comp,now).map(v=>v.id)).toEqual(['b']);expect(dashboardSelection(vs,'mine','all',undefined,comp,now)).toHaveLength(0);});
 it('30일과 90일은 업로드 시점으로 제한하고 미래 또는 잘못된 날짜 제외',()=>{const vs=[video('a','a',20),video('b','a',45),video('c','a',100),{...video('d','a'),publishedAt:'invalid'},{...video('e','a'),publishedAt:new Date(now+day).toISOString()}];expect(dashboardSelection(vs,'all','30',undefined,new Set(),now).map(v=>v.id)).toEqual(['a']);expect(dashboardSelection(vs,'all','90',undefined,new Set(),now).map(v=>v.id)).toEqual(['a','b']);});
 it('누적 조회수 순위는 비공개 조회수 제외',()=>expect(topViewed([video('a','a',2,null),video('b','a',2,5),video('c','a',2,10)]).map(v=>v.id)).toEqual(['c','b']));
 it('관측 데이터가 한 건이거나 1시간 미만이면 급상승 후보 제외',()=>{const v=[video('a','mine')];expect(risingObserved(v,[snap('a',0,110)],now)).toHaveLength(0);expect(risingObserved(v,[snap('a',0,110),snap('a',.5,100)],now)).toHaveLength(0);});
 it('순위는 관측 증가량이 아닌 시간당 증가량으로 계산하고 관측 기간을 보임',()=>{const vs=[video('a','A'),video('b','B')];const result=risingObserved(vs,[snap('a',0,500),snap('a',10,100),snap('b',0,190),snap('b',1,100)],now);expect(result.map(x=>x.video.id)).toEqual(['b','a']);expect(result[0].deltaViews).toBe(90);expect(result[0].hours).toBe(1);});
 it('감소·미래 관측·오래된 관측은 순위에 사용하지 않음',()=>{const vs=[video('a','A'),video('b','B'),video('c','C')];expect(risingObserved(vs,[snap('a',0,80),snap('a',5,100),snap('b',-(1),200),snap('b',2,100),snap('c',9*24,120),snap('c',10*24,100)],now)).toHaveLength(0);});
 it('선택된 영상만 관측치 사용, 여러 스냅샷 중 최소 1시간 경과한 최신 이전값 선택',()=>{const result=risingObserved([video('a','A')],[snap('a',0,200),snap('a',.2,199),snap('a',2,150),snap('b',0,10000),snap('b',4,1)],now);expect(result).toHaveLength(1);expect(result[0].hours).toBe(2);expect(result[0].deltaViews).toBe(50);});
});
