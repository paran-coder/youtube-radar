import { useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, Database, FileJson, Info, KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import type { Page } from '../lib/types';
import './user-guide.css';

type GuideTarget = Exclude<Page, 'channel' | 'user-guide'>;
type GuideStep = { title: string; subtitle: string; target: GuideTarget; button: string; instructions: string[]; tip?: string };

export const USER_GUIDE_STEPS: GuideStep[] = [
  {
    title: 'API 키 연결하기', subtitle: '처음 한 번만 준비하면 됩니다', target: 'settings', button: '설정에서 키 연결',
    instructions: [
      '왼쪽 메뉴에서 ‘설정 및 데이터’를 엽니다.',
      'Google Cloud에서 만든 YouTube Data API 키를 입력합니다. 키가 없다면 별도 ‘API 키 발급 가이드’를 먼저 확인하세요.',
      '웹사이트 제한·API 제한을 확인한 다음 ‘연결 확인 및 적용’을 누릅니다.',
    ],
    tip: '키는 JSON 백업에 들어가지 않습니다. 키를 기억하도록 선택하지 않으면 탭을 닫은 뒤 다시 입력해야 합니다.',
  },
  {
    title: '관심 채널 검색하고 저장하기', subtitle: '채널명·@핸들·URL을 사용할 수 있습니다', target: 'search', button: '채널 검색 열기',
    instructions: [
      '‘채널 검색’ 메뉴에서 채널명, @핸들 또는 채널 URL을 입력합니다.',
      '채널명이 겹친다면 검색 결과의 사진과 설명을 확인하고 정확한 채널을 선택합니다.',
      '채널 상세 분석에서 최근 영상 50개를 수집하면 ‘내 라이브러리’에 저장됩니다.',
    ],
    tip: '저장된 자료는 같은 브라우저에서 다시 볼 수 있습니다. 다른 기기와 자동으로 동기화되지는 않습니다.',
  },
  {
    title: '내 기준 채널 지정하기', subtitle: '비교의 출발점이 되는 채널입니다', target: 'owners', button: '내 채널 관리 열기',
    instructions: [
      '먼저 자신의 채널을 검색해 저장합니다.',
      '‘내 채널 관리’에서 해당 채널을 등록합니다.',
      '대표 채널은 하나만 지정됩니다. 채널을 여러 개 등록하고 대표 기준을 바꿀 수도 있습니다.',
    ],
    tip: '소유권 로그인 없이 사용자가 지정하는 기준 채널입니다. 비공개 YouTube 스튜디오 분석 정보는 표시하지 않습니다.',
  },
  {
    title: '경쟁 채널 찾아서 연결하기', subtitle: '세 종류의 경쟁 역할을 구분합니다', target: 'discover', button: '경쟁 채널 탐색 열기',
    instructions: [
      '‘경쟁 채널 탐색’에서 기준 채널을 선택합니다.',
      '검색어를 입력해 전 세계 관련 채널을 찾거나 저장된 채널을 연결합니다.',
      '‘직접 경쟁’, ‘성과 벤치마크’, ‘콘텐츠 참고’ 중 역할을 고릅니다.',
      '이미 연결된 채널은 화면 중간의 ‘등록된 경쟁 채널’에서 역할 변경과 연결 해제를 할 수 있습니다.',
    ],
    tip: '‘경쟁 연결 해제’는 관계만 없앱니다. 채널 정보와 영상은 내 라이브러리에 계속 남습니다.',
  },
  {
    title: '조회수와 콘텐츠 전략 비교하기', subtitle: '조건을 맞추고 해석하세요', target: 'compare', button: '채널 성과 비교 열기',
    instructions: [
      '기준 채널과 경쟁 채널을 선택합니다.',
      '기본 최근 90일 범위에서 롱폼과 쇼츠를 분리해 확인합니다.',
      '평균 조회수뿐 아니라 중앙값, 영상 표본 수, 수집 시각의 차이를 함께 확인합니다.',
      '인기 콘텐츠·숨은 강자·제목 패턴·대응 전략 탭을 비교합니다.',
    ],
    tip: '누적 조회수는 영상별 게시 후 경과시간이 다릅니다. 숫자만으로 성공 원인을 단정하지 마세요.',
  },
  {
    title: '채널 정보 수동으로 갱신하기', subtitle: '자동 갱신은 하지 않습니다', target: 'library', button: '내 라이브러리 열기',
    instructions: [
      '‘내 라이브러리’에서 저장된 채널을 찾습니다.',
      '채널 오른쪽의 새로고침 아이콘을 눌러 데이터를 다시 수집합니다.',
      '마지막 갱신 시각을 확인하고 분석 화면으로 돌아가 비교합니다.',
    ],
    tip: '갱신하려면 API 키와 인터넷 연결이 필요합니다. 이전 공개 API 데이터는 보관 정책에 따라 정리됩니다.',
  },
  {
    title: 'JSON 파일로 백업하고 복원하기', subtitle: '기기를 바꿀 때 특히 중요합니다', target: 'settings', button: '백업·복원 설정 열기',
    instructions: [
      '‘설정 및 데이터’의 ‘JSON 데이터 백업 및 복원’으로 이동합니다.',
      '‘JSON 다운로드’ 버튼으로 현재 저장 자료를 내보냅니다.',
      '다른 브라우저에서는 ‘병합’ 또는 ‘교체’를 선택한 뒤 JSON 파일을 가져옵니다.',
      '복원 후 ‘내 채널 관리’와 ‘경쟁 채널 탐색’에서 등록 관계를 확인합니다.',
    ],
    tip: '‘교체’는 기존 데이터를 덮어쓰므로 주의하세요. API 키는 백업·복원되지 않습니다.',
  },
  {
    title: '불필요한 채널 완전히 삭제하기', subtitle: '경쟁 연결 해제와 삭제는 다릅니다', target: 'library', button: '저장 채널 정리하기',
    instructions: [
      '경쟁 목록에서 ‘연결 해제’를 누르면 선택한 기준 채널과의 관계만 지워집니다.',
      '채널을 완전히 없애려면 ‘내 라이브러리’의 휴지통을 누르거나 경쟁 탐색의 ‘저장 데이터 삭제’를 누릅니다.',
      '완전 삭제는 해당 채널의 영상·관측 기록·모든 경쟁 관계 및 내 채널 등록까지 함께 제거합니다.',
      '실수로 삭제하지 않도록 확인창의 채널명을 읽고 진행합니다.',
    ],
    tip: '[QA]로 시작하는 테스트 채널도 자동으로 삭제되지 않습니다. 이름을 확인하고 개별 삭제하세요.',
  },
];

const faq = [
  { question: '등록된 경쟁 채널을 해제했는데 목록에 다시 나타나요.', answer: '연결만 해제하면 공개 채널 자료는 남아 있기 때문에 ‘연결하지 않은 저장 채널’에 다시 표시됩니다. 저장 자료까지 없애려면 ‘저장 데이터 삭제’ 또는 내 라이브러리의 삭제 기능을 사용하세요.' },
  { question: '내 기준 채널에 다른 채널을 추가해도 되나요?', answer: '가능합니다. 여러 기준 채널을 등록하고 하나를 대표로 지정할 수 있습니다. 경쟁 목록은 기준 채널별로 별도 관리됩니다.' },
  { question: '쇼츠인데 미분류로 나타나요.', answer: '공개 API만으로 정확한 쇼츠 여부를 판단할 수 없는 영상은 미분류로 표시됩니다. 채널 상세에서 영상 유형을 직접 지정할 수 있습니다.' },
  { question: '새로고침하면 최신 유튜브 조회수가 자동으로 바뀌나요?', answer: '페이지 새로고침은 로컬 자료를 다시 표시합니다. 최신 조회수를 수집하려면 채널의 ‘수동 갱신’을 눌러야 합니다.' },
  { question: '테스트 데이터를 안전하게 지우고 싶어요.', answer: '먼저 JSON 백업을 하고, 내 라이브러리에서 [QA]로 시작하는 채널만 개별 삭제하세요. 전체 초기화를 누를 필요는 없습니다.' },
];

export default function UserGuide({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [openStep, setOpenStep] = useState(0);
  return <div className="yr-user-guide">
    <section className="yr-ug-intro">
      <div><span className="yr-ug-overline"><BookOpen size={15}/> 시작 안내</span><h2>처음부터 경쟁 분석까지,<br/>순서대로 따라 해보세요.</h2><p>API 키 발급 방법과 실제 프로그램 사용법은 서로 다릅니다. 이 페이지는 <strong>YouTube Radar를 사용하는 방법</strong>을 안내합니다.</p></div>
      <div className="yr-ug-quick"><span>처음 사용한다면</span><strong>API 연결 → 채널 저장 → 기준 채널 등록 → 경쟁 분석</strong><button type="button" onClick={()=>onNavigate('api-guide')}><KeyRound size={16}/> API 키 발급 안내 보기 <ArrowRight size={15}/></button></div>
    </section>
    <div className="yr-ug-toc" aria-label="사용 가이드 목차">
      <span>목차</span>{USER_GUIDE_STEPS.map((step,i)=><button key={step.title} className={i===openStep?'selected':''} onClick={()=>{setOpenStep(i);document.getElementById('yr-ug-steps')?.scrollIntoView({block:'start',behavior:'smooth'});}}>{String(i+1).padStart(2,'0')} {step.title}</button>)}
    </div>
    <section className="yr-ug-steps" id="yr-ug-steps" aria-label="단계별 사용 설명"><div className="yr-ug-section-head"><h3>단계별 사용 방법</h3><p>단계를 눌러 설명을 펼치고, 오른쪽 버튼으로 해당 화면을 바로 열 수 있습니다.</p></div>
      {USER_GUIDE_STEPS.map((step,i)=><article className={`yr-ug-step ${openStep===i?'expanded':''}`} key={step.title}>
        <button type="button" aria-expanded={openStep===i} aria-controls={`yr-ug-panel-${i}`} className="yr-ug-step-toggle" onClick={()=>setOpenStep(openStep===i?-1:i)}><span className="yr-ug-number">{String(i+1).padStart(2,'0')}</span><span className="yr-ug-step-title"><strong>{step.title}</strong><small>{step.subtitle}</small></span><ChevronDown className="yr-ug-chevron" size={19}/></button>
        {openStep===i&&<div className="yr-ug-step-body" id={`yr-ug-panel-${i}`}><ol>{step.instructions.map(line=><li key={line}>{line}</li>)}</ol>{step.tip&&<div className="yr-ug-tip"><Info size={16}/><p>{step.tip}</p></div>}<div className="yr-ug-actions"><button type="button" className="btn btn-primary" onClick={()=>onNavigate(step.target)}>{step.button} <ArrowRight size={15}/></button>{i===0&&<button type="button" className="btn btn-outline" onClick={()=>onNavigate('api-guide')}>API 키 발급이 처음이에요</button>}</div></div>}
      </article>)}
    </section>
    <section className="yr-ug-support"><div className="yr-ug-section-head"><h3>자주 묻는 질문</h3><p>처음 사용하면서 혼동하기 쉬운 상황을 모았습니다.</p></div>{faq.map(f=><details key={f.question}><summary>{f.question}<ChevronDown size={18}/></summary><p>{f.answer}</p></details>)}</section>
    <div className="yr-ug-bottom"><div><ShieldCheck size={20}/><span><strong>분석 자료는 개인 브라우저에 저장됩니다.</strong><small>자동 클라우드 동기화가 없으므로 중요한 데이터는 JSON으로 백업하세요.</small></span></div><div className="yr-ug-bottom-actions"><button type="button" onClick={()=>onNavigate('library')}><Database size={16}/> 라이브러리</button><button type="button" onClick={()=>onNavigate('settings')}><FileJson size={16}/> JSON 백업</button><button type="button" onClick={()=>onNavigate('library')}><Trash2 size={16}/> 채널 정리</button></div></div>
  </div>;
}
