# YouTube Radar v1.6.1 — context notes

## 확정된 제품 요구사항
- 여러 사용자가 쓸 수 있는 무료 정적 웹앱, GitHub → Vercel
- 사용자별 개인 YouTube Data API 키, 로컬 브라우저 IndexedDB, 수동 갱신, JSON 백업
- 전 세계 채널 기본 검색(검색어/결과의 제약 고지), 채널당 최신 영상 50개 기본 수집
- 내 기준 채널 다중 등록, 대표 지정, 경쟁 그룹 3유형, 롱폼/쇼츠/미분류 구분
- 경쟁 분석: 최근 90일 기본, 중앙값/분포/표본 경고, 제목 패턴/썸네일 실험 가설
- 대시보드: 모든 채널/내 채널/경쟁 채널, 30·90일, 누적 조회수/관측 급상승

## 릴리스 단계 및 코드 변경
### 1.5.1: JSON·DB
- `src/lib/backupIntegrity.ts` 추가: 파일 내부 중복/만료/미래 날짜/참조 정합성을 순수 함수에서 판단.
- `src/lib/storage.ts`: 데이터 병합·교체와 전체 초기화를 IndexedDB 원자 트랜잭션으로 변경.
- 화면의 import toast: 실제 추가/갱신/제외 건수 표시.
- 기존 사용자 그룹 참조 중 채널 공개 메타데이터가 만료된 항목은 의도적 보존. 신규 유입의 잘못된 그룹 참조는 제외.
- Backup JSON 스키마 **1.0.0 유지**, IndexedDB schema **1 유지**. 사용자 마이그레이션 불필요.

### 1.5.2: 검사 체계
- `tests/backup-integrity.test.ts`: 주요 병합/교체/중복/만료 단위 테스트.
- `scripts/backup-integrity-regression.cjs`: 외부 패키지 없이 순수 모듈 회귀 점검.
- `tests/e2e/backup-flow.spec.ts`, `playwright.config.ts`: Chromium 브라우저 시나리오.
- `.github/workflows/quality.yml`: PR/main에서 빌드, Vitest, QA 스크립트, E2E 실행.
- **미완료:** npm DNS `EAI_AGAIN`으로 lockfile 생성/전체 npm 설치, Playwright 실행, 실제 CI 검증 불가. CI는 임시로 `npm install` 사용; lockfile 도입 시 `npm ci` 전환.

### 1.6.0: 분석 및 OG
- `src/lib/competition.ts`: 조회수 비공개 표본 및 과도한 해석에 대한 경고 보강.
- `src/App.tsx`, `src/components/CompetitionInsights.tsx`: 글로벌 검색의 표본 한계 및 채널 수치 표기 보강.
- `index.html`: OG, Twitter 카드 URL을 고정 운영 도메인 `/og-image.png`로 설정.
- v1.6.0 단계에는 `public/og-image.png`가 없었지만, **v1.6.1에서 사용자가 첨부한 이미지를 실제 파일로 포함**해 해결함.
- `public/sw.js`: v1.6.0 개발 시 정적 캐시 키를 변경했고 v1.6.1에서 재갱신해 적용했습니다.

## 검증 상태
- `npm run qa:all` 통과, 순수 분석/백업 타입 검사 통과, 변경 TS/TSX·CSS 구문 검사 통과.
- `npm run build` 시 설치되지 않은 `vite/client` 타입에 의한 TS2688, `npm test` 시 `vitest: not found`를 확인함. 실제 Playwright E2E는 실행하지 못함.
- 기존 v1.5.0 Vercel 운영 배포는 변경하지 않았음.
- 개발 단계 자체 평가: 1.5.1 **8/10**, 1.5.2 **6/10**, 1.6.0 **8/10**, 종합 **7.3/10** (빌드 미검증 감점).

## 후속 개발자에게
1. 새 브랜치/Preview에서 `npm install`, `npm run build`, `npm test`, `npm run qa:all`, `npx playwright install chromium`, `npm run test:e2e` 순서로 실행.
2. npm lockfile 생성 및 CI를 `npm ci`로 변경한 뒤 다시 테스트.
3. 새 JSON 병합의 대용량/동시성 테스트, 브라우저 실기 E2E, 기존 데이터 보존 확인.
4. 사용자 제작 `public/og-image.png`를 추가하고 공유 카드 실제 노출 확인.
5. 테스트 성공 전 Production 배포는 하지 말 것.

### 1.6.1: 브랜드 이미지·반복 방문 온보딩
- 사용자가 첨부한 `logo(1).png`를 `public/logo.png`로 보존하고 sidebar 로고, 상단 우측 브랜드 마크, PNG favicon(64), Apple Touch Icon(180)에 활용.
- 사용자가 첨부한 `og-image(9).png`를 원본 비율에 맞춰 `public/og-image.png`(1200×630)로 리사이즈; 기존 `index.html`의 OG/Twitter Card URL과 연결 완료.
- 대시보드 상단 히어로는 첫 방문 펼침, 다음 방문 접힘. 작은 안내 바에 다시 보기 버튼 노출.
- `src/lib/dashboardIntro.ts`에서 localStorage의 `youtube-radar-dashboard-intro-seen-v1` 키만 사용. React StrictMode에 안전하도록 state 초기화 시 읽기만, 최초 mount의 `useEffect`에서 방문 표시 저장. 버튼은 컴포넌트 안에서만 열고 닫음. 개인정보·API 키·IndexedDB에 영향 없음.
- `public/sw.js` 정적 셸 캐시 버전을 v1.6.1로 갱신. 신규 OG/로고 에셋은 브라우저 네트워크에서 정적으로 제공하며 API 응답은 캐시하지 않음.
- 회귀 검사는 `scripts/onboarding-brand-regression.cjs`와 기존 `npm run qa:all`에 연결됨. 전체 React/Vite 빌드와 Playwright는 npm 의존성 확보 후 CI 또는 미리보기에서 별도 검증 필요.
