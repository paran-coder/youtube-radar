# YouTube Radar — Context Notes (v1.3.2)

## 초기 승인된 제품 목표 (변경 이력 아래 참조)
한국어 중심 공개 YouTube 경쟁 채널 분석 웹서비스. 누구나 자신의 Google Cloud YouTube Data API 키를 사용하며, 서버 데이터 저장 또는 사용자 계정은 없다. 채널당 최초 최근 50개 영상을 수집한다. 사용자가 요청할 때만 갱신하며, 수집 자료는 브라우저 IndexedDB에 저장한다. 데이터는 JSON으로 가져오거나 내보낸다. GitHub의 정적 앱을 Vercel에 배포한다.

## 필수 기능
- 채널 URL / @handle 직접 조회, 채널명 검색(한국어 관련성 우선)
- 채널 메타데이터, 주제/카테고리 분포, 영상 필터/정렬
- 롱폼과 쇼츠 구분: 확인되지 않는 영상은 미분류, 사용자 수동 태깅 지원
- 다중 '내 기준 채널', 대표 채널 1개 설정, 기준별 경쟁 채널 그룹
- 조회수 상위 및 소규모 채널 고조회수 탐색, 경쟁 채널 후보 검색
- 비교 화면(원본 공개 수치 중심, 비교 기간·유형 명시)
- JSON 복원/내보내기, 로컬 데이터 전부 삭제, API 키 저장은 선택 사항
- 모바일·데스크톱 반응형, 로딩·오류·오프라인 상태

## 아키텍처
React 19 + TypeScript + Vite. Dexie (IndexedDB), Fetch API, Lucide, Recharts. Vercel 정적 배포. API 키는 기본 메모리, 사용자 선택 시 별도 localStorage. API 키를 JSON으로 내보내지 않음. 서버 호출은 YouTube API 외 없음. Youtube 공개 API 데이터는 기본 30일 수명으로 제한하는 보수적 구현.

## 제약 및 위험
- 공개 Data API는 정확한 Shorts 판별값을 제공하지 않음. 3분 초과 동영상은 롱폼으로 표시할 수 있지만 짧은 영상은 사용자가 지정하기 전까지 미분류로 처리.
- 구독자 공개·좋아요·댓글 정보는 제공되지 않을 수 있음. 없는 값은 0으로 취급하지 않음.
- 단순 API 키로는 내 채널의 YouTube Analytics 비공개 지표에 접근 불가.
- 키와 검색 호출의 사용자별 프로젝트 운영은 YouTube 공식 정책 적합성 별도 검토 필요. 앱이 자동 인증 또는 정책 준수를 보증하지 않음.
- 브라우저 저장 데이터는 기기 및 사이트별 격리; 데이터 내보내기 필요.
- 정적 웹앱은 사용자가 브라우저를 닫으면 자동 수집 불가능.

## 범위 제외
로그인, 서버 DB, 자동 백그라운드 수집, AI 원인분석, 임의로 구성된 성공점수, 정확하지 않은 자동 Shorts 판별, OAuth 기반 Analytics, 전역 경쟁 순위.


### 2026-10-09 후속 핸드오버
수정 릴리스 1.0.1: 재수집 표본 정리, 중복 기준 채널 보존, 삭제 시 대표 자동 지정. npm 네트워크 연결 실패로 실제 번들 빌드 검증은 남았습니다. GitHub/Vercel 연동 계정은 확인되었으나 이 로컬 폴더는 Git 저장소가 아니고 원격에 업로드되지 않았습니다.

## Vercel 빌드 오류 대응 (v1.0.2)
- 사용자 로그: App.tsx(106,541), (107,396) TS2349; storage.ts(48,100) TS2554.
- 대응: 비동기 실행기 run의 반환 Promise 이중호출 제거; Dexie 트랜잭션 테이블을 배열로 전달.
- npm 레지스트리 DNS 실패로 프로덕션 빌드와 실제 Vercel 배포는 미검증.


## v1.1.0 승인된 작업: 초보자용 API 키 설정 안내
- 사용자 승인: 사용자 승인에 따라 YouTube Radar 전용 7단계 API 키 안내를 추가.
- /api-guide 독립 페이지(상단 개요, sticky 목차, Google Cloud 직접 링크, 7단계, 복사, 체크리스트, FAQ, 오류 해결, 키 보안).
- 기존 설정·API 미연결 배너·사이드바에서 가이드로 이동하고 설정으로 복귀.
- YouTube Radar는 타 채널 공개 정보 분석만 하므로 OAuth Client/동의 화면/리디렉션 URI/클라이언트 보안키 만들기 안내는 절대 넣지 않음.
- 보안 확인 항목은 권장 및 수동 체크. 콘솔 설정을 원격에서 자동으로 검사했다고 주장하지 않음.
- IndexedDB 스키마, 채널 수집, JSON 형식 변경 금지. 배포는 빌드 검증 후 진행.


## v1.1.1: API 키 진입점 정리
- GitHub `main` 브랜치에 v1.0.2만 올라간 배포에는 가이드가 표시되지 않으므로 v1.1.1 전체 파일로 교체해야 합니다.
- API 키 미연결 시 상단 중복 버튼을 제거했습니다. 첫 진입은 **API 키 발급 가이드**, 보조 진입은 **이미 키가 있어요**입니다.
- 상태 표시를 **브라우저에 저장됨**으로 명확히 바꿨습니다. 이 표시를 눌러야 하는 버튼으로 안내하지 않습니다.
- 모바일에서도 미연결 배너의 가이드 버튼이 우선 표시되며, `/api-guide`는 직접 접근할 수 있습니다.


## v1.2.0 디자인 개편 (2026-10-09)
- 사용자가 제공한 UI Polish 스킬 및 DESIGN-slack 토큰에서 디자인 원칙만 추출해 프로젝트 고유 UI로 적용한다.
- 기능/데이터 계층은 변경하지 않는다. 컬러: 오버진 중심, 크림/화이트 서피스, 링크 블루, 의미색만 보조 사용.
- 우선순위: 텍스트 위계(14px 이상 핵심 본문), 명확한 CTA, 비장식형 히어로, 편안한 테이블. 모든 버튼 모바일 터치 크기 확보.
- API 키 가이드도 동일한 토큰으로 스타일 통합, CSS로 reduced motion 지원.

## v1.2.1 긴급 패치
Vercel `src/App.tsx(5,299) TS6133`: UI 개편 후 미사용 `Sparkles` 아이콘 import 제거. TypeScript `noUnusedLocals`를 유지하며 빌드 설정을 완화하지 않음.


## v1.3.0 development kickoff (2026-10-09)
Approved by user direction to stop repetitive review and implement. Scope: competition analysis redesigned without extra API keys, keep static browser-only architecture. Global search enabled; channel relationships are labels (direct competitor, benchmark, inspiration), compare with explicit sample sizes and time windows, avoid invented causal claims. Previous source: v1.2.1.


## v1.3.0 구현 결과
- `src/lib/competition.ts` 새 분석 엔진: 기간·유형 필터, 표본 통계, 표본 경고, 제목 패턴, 소형 채널 대표 영상, 공식 카테고리 차이, 템플릿 기반 제작안.
- UI: 경쟁 채널 역할 직접 편집, 5개 탭, 모바일 및 reduced-motion CSS.
- BYOK/IndexedDB/JSON 스키마 하위 호환, 글로벌 채널 검색, Vercel용 정적 캐시 버전 갱신.
- 미구현: 이미지 자체의 자동 특징 분석, 댓글 감정, 경쟁 시장 전체 규모, 별도 AI API, YouTube Analytics 인증.


## v1.3.2 경쟁 채널 탐색 목록 수정
- 기존 연결된 경쟁 채널을 별도 목록에서 표시합니다.
- 여러 기준 채널이 있는 경우 화면에서 선택하여 각자의 경쟁 목록을 확인합니다.
- 등록되지 않은 저장 채널과 이미 연결된 채널을 명확히 구분합니다.
- 경쟁 관계만 해제할 수 있으며 원본 채널·영상 데이터는 보존합니다.
- IndexedDB 저장소 구조 및 JSON 백업 스키마는 변경하지 않았습니다.


## v1.3.2 QA 영상 검증 후 수정 (2026-10-09)
- JSON 병합 시 기존 기준 채널의 대표 지정 상태를 보존하고, 신규로 들어오는 중복 대표 지정을 방지합니다.
- 과거에 발생한 중복 대표 지정은 앱 시작 시 기존 대표를 우선 보존하여 하나로 정리합니다.
- 이 수정은 채널·영상·경쟁 관계를 삭제하지 않습니다.
- QA 샘플이 기존 브라우저에 병합됐다면 샘플 채널은 사용자가 라이브러리에서 별도로 삭제해야 합니다.
- 실제 브라우저/프로덕션 빌드 재검증은 아직 필요합니다.


## v1.4.0 — 사용 가이드 및 데이터 삭제 UX
- 기존 v1.3.2에서 출발하며 IndexedDB 스키마와 백업 버전 1.0.0을 유지합니다.
- `/user-guide`로 별도의 실사용 가이드를 구현하며 API 키 발급 가이드는 `/api-guide`에 그대로 둡니다.
- '경쟁 관계 해제'와 '채널 데이터 완전 삭제'를 별개의 액션으로 노출합니다.
- 채널 완전 삭제는 channels/videos/snapshots/owners/competitors를 한 트랜잭션에서 삭제합니다.
- 테스트 QA 채널은 자동 삭제하지 않으며 사용자의 명시적 삭제만 허용합니다.
- 사용자별 API 키와 로컬 저장 모델을 변경하지 않습니다.
