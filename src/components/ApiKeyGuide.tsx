import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ClipboardCopy, ExternalLink, HelpCircle, Info, KeyRound, LockKeyhole, MousePointerClick, ShieldCheck, Youtube } from 'lucide-react';

export const RADAR_SITE_REFERRER = 'https://youtube-radar-six.vercel.app/*';
export const API_GUIDE_STEP_TITLES = [
  'Google 계정 준비',
  '새 프로젝트 만들기',
  'YouTube API 켜기',
  'API 키 발급하기',
  '웹사이트 사용 제한',
  'YouTube API만 허용',
  'Radar에서 연결 확인',
] as const;
export const SECURITY_CONFIRM_KEY = 'youtube-radar-api-security-v1';

type SecurityFlags = { site: boolean; api: boolean };
const defaults: SecurityFlags = { site: false, api: false };
export function readSecurityFlags(): SecurityFlags {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SECURITY_CONFIRM_KEY) || 'null');
    if (typeof parsed === 'object' && parsed !== null && 'site' in parsed && 'api' in parsed) {
      const value = parsed as Record<string, unknown>;
      return { site: value.site === true, api: value.api === true };
    }
  } catch { /* storage may be unavailable */ }
  return defaults;
}
export function saveSecurityFlags(flags: SecurityFlags) {
  try { window.localStorage.setItem(SECURITY_CONFIRM_KEY, JSON.stringify(flags)); }
  catch { /* session-only state still works */ }
}

function CopyValue({ label, value }: { label: string; value: string }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setMessage('복사됐어요');
    } catch {
      setMessage('복사가 안 되면 값을 길게 눌러 직접 복사하세요');
    }
  }
  return <div className="yrg-copy"><div><span>{label}</span><code>{value}</code></div><button type="button" onClick={() => void copy()} aria-label={`${label} 복사`}><ClipboardCopy size={15}/>{message === '복사됐어요' ? '복사 완료' : '복사'}</button>{message && <small role="status">{message}</small>}</div>;
}
function ExternalAction({ href, children }: { href: string; children: ReactNode }) {
  return <a className="yrg-extern" href={href} target="_blank" rel="noopener noreferrer">{children}<ExternalLink size={15}/></a>;
}
function Notice({ title, children }: { title: string; children: ReactNode }) {
  return <div className="yrg-note"><Info size={17} aria-hidden="true"/><div><strong>{title}</strong><p>{children}</p></div></div>;
}
function Step({ number, title, summary, link, action, done, toggle, children }: {
  number: number; title: string; summary: string; link?: string; action?: string;
  done: boolean; toggle: () => void; children: ReactNode;
}) {
  return <section className="yrg-step" id={`step-${number}`} aria-label={`${number}단계 ${title}`}>
    <div className="yrg-step-heading"><span className="yrg-step-num">{number.toString().padStart(2, '0')}</span><div><h3>{title}</h3><p>{summary}</p></div><CheckCircle2 className={done ? 'yrg-step-done' : 'yrg-step-muted'} size={22} aria-label={done ? '완료 표시됨' : '아직 완료 표시 안 됨'}/></div>
    <div className="yrg-step-body">{children}
      <div className="yrg-step-actions">{link && action && <ExternalAction href={link}>{action}</ExternalAction>}<button className={`yrg-done-btn ${done ? 'complete' : ''}`} type="button" onClick={toggle}><Check size={16}/>{done ? '완료 표시 취소' : '이 단계 마쳤어요'}</button></div>
    </div>
  </section>;
}

const errors = [
  { title: 'API key not valid / 잘못된 키 (400)', detail: '키를 복사할 때 앞뒤에 공백이 붙었는지 확인하세요. Google Cloud Console → 사용자 인증 정보에서 해당 키를 다시 확인하거나 새로 만듭니다.' },
  { title: 'API has not been used / API를 사용하지 않음 (403)', detail: '2단계에서 만든 프로젝트가 선택되어 있는지 확인한 뒤 3단계에서 YouTube Data API v3의 사용 설정을 다시 확인하세요.' },
  { title: 'API key is not authorized / 리퍼러 차단 (403)', detail: '5단계의 허용 웹사이트 주소가 실제 접속 주소와 같은지 확인하고 저장합니다. 변경 사항이 반영되기까지 잠시 걸릴 수 있습니다.' },
  { title: 'Quota exceeded / 할당량 초과 (403)', detail: 'Google Cloud Console에서 YouTube Data API v3의 할당량을 확인하세요. API 키를 새로 만든다고 프로젝트의 할당량이 늘어나는 것은 아닙니다.' },
  { title: 'API 키 만들기 메뉴가 보이지 않아요', detail: '상단에서 프로젝트가 선택되어 있는지 확인하세요. API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → API 키 순서로 이동할 수 있습니다.' },
];

export default function ApiKeyGuide({ onSettings }: { onSettings: () => void }) {
  const [done, setDone] = useState<number[]>([]);
  const [security, setSecurity] = useState<SecurityFlags>(readSecurityFlags);
  useEffect(() => { saveSecurityFlags(security); }, [security]);
  function toggle(number: number) { setDone(prev => prev.includes(number) ? prev.filter(x => x !== number) : [...prev, number]); }
  const completed = done.length;
  return <div className="yrg">
    <section className="yrg-hero" aria-labelledby="yrg-title">
      <div className="yrg-hero-copy"><span className="yrg-eyebrow"><BookOpen size={15}/> 처음 시작하는 분을 위한 안내</span><h2 id="yrg-title">유튜브 API 키 만들기,<br/><span>하나씩 따라 하면 됩니다.</span></h2><p>Google Cloud를 처음 사용하셔도 괜찮습니다. 복잡해 보이는 화면에서 무엇을 클릭해야 하는지 7단계로 설명합니다.</p><div className="yrg-hero-actions"><a href="#step-1" className="yrg-primary">1단계부터 시작 <ArrowRight size={17}/></a><button type="button" className="yrg-secondary" onClick={onSettings}>이미 키가 있어요 <KeyRound size={17}/></button></div></div>
      <aside className="yrg-ready"><span>시작 전 준비물</span><strong>Google 계정 하나</strong><ul><li>Google 계정으로 로그인할 수 있으면 됩니다.</li><li>약 5~15분 정도 시간을 확보하세요.</li><li>결과를 붙여 넣을 YouTube Radar 탭을 열어 두세요.</li></ul><div><ShieldCheck size={16}/> 공개 채널 분석에는 OAuth 클라이언트 ID가 필요하지 않습니다.</div></aside>
    </section>
    <div className="yrg-columns">
      <nav className="yrg-toc" aria-label="API 발급 가이드 목차"><b>이 페이지에서</b><a href="#yrg-overview">전체 흐름</a>{API_GUIDE_STEP_TITLES.map((title,i) => <a key={title} href={`#step-${i+1}`}>{i+1}. {title}</a>)}<a href="#yrg-security">보안 확인</a><a href="#yrg-troubleshooting">문제 해결</a></nav>
      <div className="yrg-content">
        <section id="yrg-overview" className="yrg-overview" aria-labelledby="yrg-overview-title"><div className="yrg-overview-head"><span className="yrg-overline">먼저 이해하기</span><h2 id="yrg-overview-title">API 키가 무엇인가요?</h2><p>API 키는 Google에 “내가 만든 프로젝트에서 YouTube의 공개 정보를 요청합니다”라고 알려 주는 비밀번호 같은 문자열입니다. 채널이나 영상을 분석할 때 쓰지만, 내 YouTube 계정 비밀번호는 아닙니다.</p></div><div className="yrg-flow"><div><span>01</span><strong>프로젝트 만들기</strong><small>Google Cloud에 내 공간 만들기</small></div><ArrowRight size={18}/><div><span>02</span><strong>API 키 만들기</strong><small>YouTube Data API 사용 설정</small></div><ArrowRight size={18}/><div><span>03</span><strong>Radar에 연결</strong><small>공개 채널 분석 시작</small></div></div><Notice title="공개 채널 분석에는 OAuth 설정이 필요하지 않습니다.">YouTube Radar는 공개된 채널과 영상 정보를 API 키로 조회합니다. OAuth 동의 화면, 클라이언트 ID·보안 비밀, 리디렉션 URI는 만들 필요가 없습니다.</Notice></section>
        <div className="yrg-progress" aria-live="polite"><div><strong>설정 따라가기</strong><span>{completed} / 7단계 확인됨</span></div><div className="yrg-progress-rail"><span style={{width:`${completed/7*100}%`}}/></div><p>완료 버튼은 본인이 진행한 단계를 표시할 뿐, Google 설정을 자동 검사하지 않습니다.</p></div>
        <div className="yrg-steps">
          <Step number={1} title="Google 계정 준비하기" summary="Google Cloud에 로그인하는 단계입니다." done={done.includes(1)} toggle={()=>toggle(1)} link="https://console.cloud.google.com/" action="Google Cloud Console 열기">
            <p>위의 <b>Google Cloud Console 열기</b> 버튼을 누릅니다. 구글 로그인 화면이 나오면 평소 사용하는 Google 계정으로 로그인하세요. 처음 접속한 경우 서비스 약관 확인 화면이 나올 수 있습니다.</p><Notice title="YouTube 채널이 없어도 됩니다">다른 사람이 공개한 영상을 분석하므로 본인 채널이 없어도 시작할 수 있습니다. Google Cloud 가입 시 결제나 과금 화면이 나온다면 필수로 결제 정보를 입력하기 전에 내용을 확인하세요.</Notice>
          </Step>
          <Step number={2} title="새 프로젝트 만들기" summary="분석 요청을 관리할 Google Cloud의 작업 공간을 만듭니다." done={done.includes(2)} toggle={()=>toggle(2)} link="https://console.cloud.google.com/projectcreate" action="새 프로젝트 만들기 열기">
            <p><b>새 프로젝트</b> 화면에서 프로젝트 이름에 <code>YouTube Radar</code>를 입력하고 <b>만들기(Create)</b>를 누르세요. 프로젝트를 만든 뒤 상단의 <b>프로젝트 선택</b> 메뉴에서 방금 만든 프로젝트를 선택합니다.</p><div className="yrg-example"><MousePointerClick size={16}/><span>확인할 것: 화면 상단에 <b>YouTube Radar</b> 프로젝트 이름이 보이는지 확인하세요.</span></div>
          </Step>
          <Step number={3} title="YouTube Data API v3 켜기" summary="YouTube 정보에 접근할 수 있도록 API 사용을 켭니다." done={done.includes(3)} toggle={()=>toggle(3)} link="https://console.cloud.google.com/apis/library/youtube.googleapis.com" action="YouTube Data API v3 열기">
            <p>링크를 연 다음 상단 프로젝트가 <b>YouTube Radar</b>인지 확인하세요. <b>사용 설정(Enable)</b> 버튼을 누릅니다. 이미 <b>관리(Manage)</b>가 보이면 활성화되어 있을 가능성이 높습니다.</p><div className="yrg-example"><CheckCircle2 size={17}/><span>성공 표시: <b>사용 설정됨(Enabled)</b> 또는 <b>관리(Manage)</b> 버튼을 확인합니다.</span></div>
          </Step>
          <Step number={4} title="API 키 발급하기" summary="YouTube Radar에 입력할 키 문자열을 만듭니다." done={done.includes(4)} toggle={()=>toggle(4)} link="https://console.cloud.google.com/apis/credentials" action="사용자 인증 정보 열기">
            <p>Google Cloud 왼쪽 메뉴에서 <b>API 및 서비스(APIs & Services) → 사용자 인증 정보(Credentials)</b>로 이동합니다. <b>+ 사용자 인증 정보 만들기(Create credentials) → API 키(API key)</b>를 선택합니다.</p><p>생성된 키는 길고 복잡한 영문·숫자 문자열입니다. <b>복사</b>한 뒤 외부 채팅이나 GitHub에 붙여 넣지 마세요. 키 이름은 알아보기 쉽게 <code>YouTube Radar Key</code>로 변경할 수 있습니다.</p><Notice title="API 키와 OAuth 클라이언트는 다릅니다">이 앱에는 <b>API 키</b>만 필요합니다. OAuth 클라이언트 ID나 클라이언트 보안 비밀번호를 만드는 메뉴를 선택하지 마세요.</Notice>
          </Step>
          <Step number={5} title="이 웹사이트에서만 사용하도록 제한하기" summary="다른 사이트에서 키를 마음대로 사용하지 못하도록 설정합니다." done={done.includes(5)} toggle={()=>toggle(5)} link="https://console.cloud.google.com/apis/credentials" action="키 제한 화면 열기">
            <p>발급된 키 이름을 누릅니다. <b>애플리케이션 제한사항(Application restrictions)</b>에서 <b>웹사이트(Websites / HTTP referrers)</b>를 선택하고, <b>웹사이트 추가</b>를 눌러 아래 주소를 등록하세요.</p><CopyValue label="허용할 웹사이트 주소 · 그대로 복사" value={RADAR_SITE_REFERRER}/><p>다른 주소에서 프로그램을 사용하는 경우, 실제 사용하는 도메인을 추가해야 합니다. 지금 사용하는 정식 서비스 주소는 <a href="https://youtube-radar-six.vercel.app/" target="_blank" rel="noopener noreferrer">youtube-radar-six.vercel.app</a>입니다.</p><Notice title="접속 주소를 확인하세요">Vercel 미리보기 주소나 localhost에서 키를 시험한다면 허용한 사이트와 다를 수 있습니다. 시험 환경은 필요할 때만 별도 키 또는 추가 도메인을 지정하세요.</Notice>
          </Step>
          <Step number={6} title="YouTube API만 허용하기" summary="키가 다른 Google API에 쓰이지 않도록 범위를 줄입니다." done={done.includes(6)} toggle={()=>toggle(6)} link="https://console.cloud.google.com/apis/credentials" action="사용자 인증 정보 돌아가기">
            <p>같은 API 키 설정 화면에서 <b>API 제한사항(API restrictions)</b>의 <b>키 제한(Restrict key)</b>을 선택하고 목록에서 <b>YouTube Data API v3</b>를 지정합니다. 화면 아래 <b>저장(Save)</b>을 누르세요.</p><div className="yrg-example"><LockKeyhole size={16}/><span>핵심: <b>웹사이트 제한 + YouTube Data API v3 제한</b> 두 가지를 모두 적용합니다.</span></div><Notice title="반영이 바로 되지 않을 수 있습니다">제한을 변경한 후에는 잠시 기다린 다음 연결을 시험하세요. 제한 설정을 확인했더라도 API 사용량 제한은 따로 적용됩니다.</Notice>
          </Step>
          <Step number={7} title="YouTube Radar에서 연결 확인하기" summary="발급한 키를 붙여 넣고 실제 API 요청으로 확인합니다." done={done.includes(7)} toggle={()=>toggle(7)}>
            <p>이제 아래의 <b>설정 화면으로 이동</b>을 누르고, <b>개인 YouTube Data API 키</b> 입력란에 키를 붙여 넣으세요. <b>연결 확인 및 적용</b> 버튼을 누르면 프로그램이 YouTube Data API에 요청하여 키가 작동하는지 확인합니다.</p><p><b>이 브라우저에 기억하기</b>는 선택 사항입니다. 공용 컴퓨터에서는 선택하지 않는 편이 안전합니다.</p><button className="yrg-inline-primary" type="button" onClick={onSettings}>API 키 입력 화면으로 이동 <ArrowRight size={16}/></button><Notice title="연결 확인과 보안 확인은 서로 달라요">API 키가 작동해도 Google Cloud의 웹사이트/API 제한이 올바르게 걸렸는지는 앱에서 자동으로 판별할 수 없습니다. 아래 보안 체크리스트에서 직접 확인해 주세요.</Notice>
          </Step>
        </div>
        <section id="yrg-security" className="yrg-security" aria-labelledby="yrg-security-title"><div className="yrg-section-label"><ShieldCheck size={18}/><span>보안 확인</span></div><h2 id="yrg-security-title">키 연결 전, 두 가지를 확인하세요.</h2><p>아래 체크는 사용자가 Google Cloud 화면에서 직접 확인한 내용입니다. 앱에서 Cloud 제한 상태를 읽어 자동 검증하는 것은 아닙니다.</p><div className="yrg-checks"><label><input type="checkbox" checked={security.site} onChange={e=>setSecurity(s=>({...s,site:e.target.checked}))}/><span><b>웹사이트(HTTP 리퍼러) 제한 설정 완료</b><small>youtube-radar-six.vercel.app에서만 키를 사용하도록 등록했어요.</small></span></label><label><input type="checkbox" checked={security.api} onChange={e=>setSecurity(s=>({...s,api:e.target.checked}))}/><span><b>API 제한에서 YouTube Data API v3 선택 완료</b><small>다른 Google API에 사용되지 않도록 키 사용 범위를 줄였어요.</small></span></label></div><div className="yrg-security-footer"><span>{security.site && security.api ? <><CheckCircle2 size={18}/> 두 항목을 모두 직접 확인했습니다.</> : <><Info size={18}/> 모두 확인할 때까지 키 보안 설정을 다시 살펴보세요.</>}</span><button type="button" className="yrg-primary" onClick={onSettings}>설정에서 연결 확인 <ArrowRight size={16}/></button></div></section>
        <section id="yrg-troubleshooting" className="yrg-trouble"><div className="yrg-section-label"><HelpCircle size={18}/><span>막혔을 때</span></div><h2>자주 발생하는 문제 해결</h2><p>오류 메시지가 나오면 비슷한 제목을 눌러 해결 방법을 확인하세요.</p><div className="yrg-faq">{errors.map(e=><details key={e.title}><summary><span>{e.title}</span><ChevronDown size={18}/></summary><p>{e.detail}</p></details>)}<details><summary><span>결제 카드나 OAuth 동의 화면이 필요한가요?</span><ChevronDown size={18}/></summary><p>공개 데이터 조회를 위한 기본 API 키 발급에는 일반적으로 OAuth 동의 화면이 필요하지 않습니다. Google Cloud에서 별도 서비스의 결제 정보를 요청하는 경우 안내문을 확인하고, 무작정 카드 정보를 입력하지 마세요.</p></details><details><summary><span>API 키를 다른 사람에게 알려 줘도 되나요?</span><ChevronDown size={18}/></summary><p>안 됩니다. 키가 노출되면 Google Cloud의 사용자 인증 정보 페이지에서 키를 삭제하거나 교체하세요. 스크린샷에 키가 보이지 않도록 주의하세요.</p></details></div></section>
        <div className="yrg-bottom"><Youtube size={23}/><div><strong>이제 채널을 분석할 준비가 되셨나요?</strong><p>키를 연결하면 내 채널과 경쟁 채널의 공개 데이터를 수동으로 수집할 수 있습니다.</p></div><button type="button" onClick={onSettings}>설정으로 돌아가기 <ArrowRight size={16}/></button></div>
        <div className="yrg-references"><span>공식 문서</span><a href="https://developers.google.com/youtube/v3/getting-started" target="_blank" rel="noopener noreferrer">YouTube Data API 안내 ↗</a><a href="https://docs.cloud.google.com/docs/authentication/api-keys" target="_blank" rel="noopener noreferrer">Google Cloud API 키 관리 ↗</a><a href="https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys" target="_blank" rel="noopener noreferrer">Google Cloud 키 제한 ↗</a></div>
        <button type="button" className="yrg-back" onClick={onSettings}><ArrowLeft size={16}/> API 키 설정으로 돌아가기</button>
      </div>
    </div>
  </div>;
}
