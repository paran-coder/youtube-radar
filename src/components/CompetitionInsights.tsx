import { useMemo, useState } from 'react';
import { ArrowUpRight, ClipboardCopy, Info, Lightbulb, TrendingUp, Type, Image as ImageIcon } from 'lucide-react';
import { categories, prettyNumber } from '../lib/utils';
import { analyzeTitlePatterns, contentCategoryGaps, selectVideos, smallChannelHighlights, titleSuggestions, type Period, type KindFilter } from '../lib/competition';
import type { Channel, Video } from '../lib/types';

type Mode = 'top' | 'small' | 'titles' | 'gaps' | 'strategy';
interface Props { base: Channel; competitors: Channel[]; videos: Video[]; kind: KindFilter; period: Period }
const MODES: { id:Mode; title:string }[] = [
  {id:'top',title:'인기 콘텐츠'}, {id:'small',title:'숨은 강자'}, {id:'titles',title:'제목 패턴'},
  {id:'gaps',title:'카테고리 차이'}, {id:'strategy',title:'내 대응 전략'},
];
function EmptyInsight({text}:{text:string}){return <div className="insight-empty">{text}</div>;}
export default function CompetitionInsights({base,competitors,videos,kind,period}:Props){
  const [mode,setMode]=useState<Mode>('top');
  const [topic,setTopic]=useState('');
  const now=Date.now();
  const mine=useMemo(()=>selectVideos(videos,base.id,kind,period,now),[videos,base.id,kind,period]);
  const competitorsVideos=useMemo(()=>competitors.flatMap(c=>selectVideos(videos,c.id,kind,period,now)),[competitors,videos,kind,period]);
  const ranking=useMemo(()=>[...competitorsVideos].filter(v=>v.viewCount!==null).sort((a,b)=>(b.viewCount??0)-(a.viewCount??0)).slice(0,8),[competitorsVideos]);
  const small=useMemo(()=>smallChannelHighlights(competitors,videos,kind,period,now),[competitors,videos,kind,period]);
  const patterns=analyzeTitlePatterns(competitorsVideos);
  const ownPatterns=analyzeTitlePatterns(mine);
  const gaps=contentCategoryGaps(mine,competitorsVideos);
  const labelMap=new Map(competitors.map(c=>[c.id,c.title]));
  const example=ranking[0];
  const titleIdeas=titleSuggestions(topic,mine.length?mine:competitorsVideos);
  const copy=(value:string)=>{void navigator.clipboard?.writeText(value).catch(()=>{});};
  return <div className="panel competition-insights">
    <div className="panel-head"><div><h3>콘텐츠 경쟁 인사이트</h3><p>현재 브라우저에 수집한 경쟁 채널 영상 {competitorsVideos.length}개를 분석합니다. 유튜브 전체 통계가 아닙니다.</p></div><TrendingUp size={19} className="muted-icon"/></div>
    <div className="insights-tabs" role="tablist" aria-label="경쟁 분석 모드">{MODES.map(m=><button key={m.id} type="button" role="tab" aria-selected={mode===m.id} className={mode===m.id?'on':''} onClick={()=>setMode(m.id)}>{m.title}</button>)}</div>
    {mode==='top'&&<><p className="insight-hint"><strong>인기 콘텐츠:</strong> 선택한 기간·영상 유형에서 누적 조회수가 높은 순서입니다. 최근에 게시된 영상이라도 업로드 후 경과시간이 다르면 직접적인 우열 판단은 어렵습니다.</p>{ranking.length?<div className="insight-list">{ranking.map((v,i)=><div className="insight-row" key={v.id}><span className="insight-rank">{i+1}</span><img src={v.thumbnail} alt="영상 썸네일" loading="lazy"/><div className="insight-video-title"><a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer">{v.title} <ArrowUpRight size={12}/></a><small>{labelMap.get(v.channelId)||'경쟁 채널'} · {new Date(v.publishedAt).toLocaleDateString('ko-KR')}</small></div><strong>{prettyNumber(v.viewCount)}</strong></div>)}</div>:<EmptyInsight text="선택 조건에 맞는 영상이 없습니다. 기간을 넓히거나 경쟁 채널을 추가하세요."/>}</>}
    {mode==='small'&&<><p className="insight-hint"><strong>숨은 강자:</strong> 구독자 5만 명 이하 채널에서 <strong>채널별 대표 영상 하나</strong>만 보여줍니다. 최근 같은 조건의 수집 영상이 최소 5개인 채널을 대상으로, 채널 자신의 누적 조회수 중앙값보다 높은 영상만 찾습니다.</p>{small.length?<div className="insight-list">{small.map((x,i)=><div className="insight-row" key={x.video.id}><span className="insight-rank">{i+1}</span><img src={x.video.thumbnail} alt="영상 썸네일" loading="lazy"/><div className="insight-video-title"><a href={`https://www.youtube.com/watch?v=${x.video.id}`} target="_blank" rel="noreferrer">{x.video.title} <ArrowUpRight size={12}/></a><small>{x.channel.title} · 비교 표본 {x.sampleCount}개 · 채널 조회수 중앙값 {prettyNumber(x.typical)}</small></div><strong>{x.ratio.toFixed(1)}배</strong></div>)}</div>:<EmptyInsight text="조건을 충족한 소형 채널이 없습니다. 경쟁 채널을 추가하거나 기간을 확대하세요. (최소 5개 영상 필요)"/>}<p className="competition-caution"><Info size={15}/> 배수는 같은 채널의 누적 조회수 중앙값 대비 참고 비율이며, 성장률·성공확률·게시 후 동일 시점 성과가 아닙니다.</p></>}
    {mode==='titles'&&<><p className="insight-hint"><strong>제목 패턴:</strong> 수집 영상 제목에서 객관적으로 찾을 수 있는 표현을 세었습니다. 하나의 제목이 여러 패턴에 포함될 수 있습니다. 빈도와 조회수의 인과관계는 확인할 수 없습니다.</p>{competitorsVideos.length?<div className="competition-patterns"><div className="pattern-heading"><span>제목 유형</span><span>경쟁 채널</span><span>내 채널</span></div>{patterns.map((p,i)=><div key={p.id} className="pattern-row"><div><b>{p.label}</b><small>{p.description}</small>{p.example&&<small className="pattern-example">예: {p.example}</small>}</div><strong>{p.count} / {competitorsVideos.length}</strong><strong>{ownPatterns[i].count} / {mine.length}</strong></div>)}</div>:<EmptyInsight text="분석할 경쟁 영상이 없습니다."/>}</>}
    {mode==='gaps'&&<><p className="insight-hint"><strong>공식 카테고리 차이:</strong> 내 채널의 수집 영상에 없고 경쟁 채널에 있는 YouTube 공식 영상 카테고리입니다. 구체적인 주제 차이나 시장 수요를 뜻하지는 않습니다.</p>{gaps.length?<div className="gap-list">{gaps.map(x=><div key={x.id} className="gap-item"><span>{categories[x.id]||`카테고리 ${x.id}`}</span><div><strong>{x.count}개 영상</strong><small>{x.channels}개 경쟁 채널</small></div></div>)}</div>:<EmptyInsight text="현재 수집된 공식 영상 카테고리에는 차이가 없습니다. 더 세밀한 세부 주제는 직접 비교해야 합니다."/>}</>}
    {mode==='strategy'&&<div className="strategy-stack">
      <p className="insight-hint"><strong>사실 → 가설 → 대응:</strong> 공개 API로 제목과 썸네일이 실제 클릭을 유발했는지는 알 수 없습니다. 아래 제작안은 <strong>추천 실험</strong>이며 자동 성공 예측이 아닙니다.</p>
      <div className="strategy-fact"><span>확인된 사실</span><p>경쟁 채널에서 분석된 영상 {competitorsVideos.length}개 · 최근 대표 영상 {example?`「${example.title}」`:'없음'}{example?` (조회수 ${prettyNumber(example.viewCount)})`:''}</p></div>
      <div className="strategy-fact"><span>관측된 제목 표현</span><p>{[...patterns].sort((a,b)=>b.count-a.count).filter(x=>x.count>0).slice(0,2).map(x=>`${x.label} ${x.count}개`).join(' · ')||'표본이 부족해 반복 표현을 확인하기 어렵습니다.'}</p></div>
      <div className="strategy-hypothesis"><Lightbulb size={17}/><div><strong>검증할 가설</strong><p>경쟁 영상에 반복된 표현이 시청자의 관심과 연관됐을 수 있습니다. 같은 주제의 내 영상에서 새로운 제목 구조를 시험해 보세요.</p></div></div>
      <label className="strategy-topic">다음 영상의 주제를 입력하세요<input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="예: 스마트폰 구매 전 확인할 사항" maxLength={90}/></label>
      {titleIdeas.length>0?<><div className="strategy-section-title"><Type size={17}/><h4>제목 실험안 3개</h4></div>{titleIdeas.map((t,i)=><div className="suggestion-row" key={t}><span>{['기본 제목','경쟁 표현 응용','차별화 실험'][i]}</span><p>{t}</p><button type="button" onClick={()=>copy(t)} title="제목 복사" aria-label={`${t} 복사`}><ClipboardCopy size={16}/></button></div>)}<div className="strategy-section-title"><ImageIcon size={17}/><h4>썸네일 구성안 2개</h4></div><div className="strategy-thumb-grid"><div><strong>A · 익숙한 형식</strong><p>기존 채널에 사용한 스타일을 유지하고, 핵심 대상 이미지와 3~5단어 문구를 강조해 보세요.</p></div><div><strong>B · 차별화 형식</strong><p>경쟁 영상과 다른 장면 또는 비교 구도, 짧은 질문형 문구를 시도해 보세요.</p></div></div><p className="competition-caution"><Info size={15}/> 실제 썸네일 이미지를 자동 분석한 결과가 아닙니다. 제안된 구성은 영상 게시 전에 직접 검토해야 합니다.</p></>:<EmptyInsight text="주제를 입력하면 제목 3개와 썸네일 구성 실험 2개가 표시됩니다."/>}
    </div>}
  </div>;
}
