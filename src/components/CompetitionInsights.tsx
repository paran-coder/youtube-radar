import {useMemo,useState} from 'react';
import {ArrowUpRight,Lightbulb,Search,TrendingUp} from 'lucide-react';
import {categories,prettyNumber} from '../lib/utils';
import type {Channel, Video} from '../lib/types';
type Mode='top'|'small'|'gaps';
interface Props{base:Channel; competitors:Channel[]; videos:Video[]}
export default function CompetitionInsights({base,competitors,videos}:Props){
 const [mode,setMode]=useState<Mode>('top');
 const ids=new Set(competitors.map(x=>x.id));const compVideos=videos.filter(v=>ids.has(v.channelId));
 const smallIds=new Set(competitors.filter(c=>c.subscriberCount!==null&&c.subscriberCount<=50000).map(c=>c.id));
 const ranking=useMemo(()=>compVideos.filter(v=>v.viewCount!==null&&(mode!=='small'||smallIds.has(v.channelId))).sort((a,b)=>(b.viewCount??0)-(a.viewCount??0)).slice(0,8),[compVideos,mode]);
 const ownCategories=new Set(videos.filter(v=>v.channelId===base.id).map(v=>v.categoryId).filter(Boolean));
 const gaps=Object.entries(compVideos.reduce<Record<string,{count:number;channelIds:Set<string>}>>((acc,v)=>{if(!v.categoryId||ownCategories.has(v.categoryId))return acc;const cur=acc[v.categoryId]??{count:0,channelIds:new Set()};cur.count+=1;cur.channelIds.add(v.channelId);acc[v.categoryId]=cur;return acc;},{})).sort((a,b)=>b[1].count-a[1].count).slice(0,8);
 const labelMap=new Map(competitors.map(c=>[c.id,c.title]));
 return <div className="panel competition-insights">
  <div className="panel-head"><div><h3>콘텐츠 경쟁 인사이트</h3><p>현재 저장된 경쟁 채널의 영상만 분석합니다. YouTube 전체 순위가 아닙니다.</p></div><TrendingUp size={19} className="muted-icon"/></div>
  <div className="insights-tabs" role="tablist" aria-label="경쟁 분석 모드"><button role="tab" aria-selected={mode==='top'} className={mode==='top'?'on':''} onClick={()=>setMode('top')}><TrendingUp size={15}/> 조회수 인기</button><button role="tab" aria-selected={mode==='small'} className={mode==='small'?'on':''} onClick={()=>setMode('small')}><Search size={15}/> 소형 채널 발굴</button><button role="tab" aria-selected={mode==='gaps'} className={mode==='gaps'?'on':''} onClick={()=>setMode('gaps')}><Lightbulb size={15}/> 콘텐츠 공백</button></div>
  {mode!=='gaps'?<><p className="insight-hint">{mode==='small'?'현재 등록된 경쟁 채널 중 공개 구독자 수 5만 명 이하 채널의 조회수 상위 영상입니다.':'등록된 경쟁 채널의 누적 조회수 상위 영상입니다.'}</p>{ranking.length?<div className="insight-list">{ranking.map((v,i)=><div className="insight-row" key={v.id}><span className="insight-rank">{i+1}</span><img src={v.thumbnail} alt="영상 썸네일" loading="lazy"/><div className="insight-video-title"><a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer">{v.title} <ArrowUpRight size={12}/></a><small>{labelMap.get(v.channelId)||'채널'}</small></div><strong>{prettyNumber(v.viewCount)}</strong></div>)}</div>:<div className="insight-empty">조건에 맞는 경쟁 영상이 없습니다. 경쟁 채널을 더 등록하거나 데이터를 갱신하세요.</div>}</>:<><p className="insight-hint">내 채널의 수집 영상 50개에는 없고 경쟁 채널에는 있는 <b>공식 영상 카테고리</b>입니다. 세부 주제 또는 시장 수요를 의미하지는 않습니다.</p>{gaps.length?<div className="gap-list">{gaps.map(([id,data])=><div key={id} className="gap-item"><span>{categories[id]||`카테고리 ${id}`}</span><div><strong>{data.count}개 영상</strong><small>{data.channelIds.size}개 경쟁 채널</small></div></div>)}</div>:<div className="insight-empty">공식 카테고리에서 차이를 찾지 못했습니다. 더 세부적인 주제 분석은 추후 기능입니다.</div>}</>}
 </div>
}
