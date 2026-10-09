# YouTube Radar v1.6.1

무료 브라우저 기반 YouTube 공개 채널·영상 분석 웹앱입니다. 사용자 본인의 YouTube Data API 키를 브라우저에서 사용하며, 수집한 분석 결과는 사용자 IndexedDB에 저장됩니다. 서버 측 저장소나 자동 백그라운드 수집은 제공하지 않습니다.

## 이번 버전의 변경

- **v1.5.1**: JSON 병합·교체 전에 날짜와 참조 관계를 검증하고 하나의 IndexedDB 트랜잭션으로 저장합니다. 만료되거나 파일 내부에서 참조 대상이 없는 영상/관계는 가져오지 않습니다. 중복 항목은 한 번만 추가합니다. 사용자 기존 대표 채널과 그룹은 병합 시 우선 보존합니다. 전체 초기화도 단일 트랜잭션으로 처리합니다. 완료 메시지는 추가·갱신·제외를 구분합니다.
- **v1.5.2**: 백업 무결성 회귀 검사, Vitest 단위 테스트, Playwright 브라우저 시나리오, GitHub Actions 품질 검사 구성을 추가했습니다. CI는 빌드 → 단위 테스트 → 회귀 검사 → Chromium E2E 순으로 실행됩니다.
- **v1.6.0**: 비교 표본의 조회수 공개 여부와 원본 전체 영상 수를 구분하고, 글로벌 검색의 검색어·부분 표본 한계를 명시했습니다. 제목/급상승 수치를 원인이나 공식 순위로 혼동하지 않도록 기존 설명을 개선했습니다.
- **v1.6.1 — 브랜드 및 온보딩**: 첨부 로고를 `public/logo.png`에 보존하고 사이드바·상단 브랜드 영역·PNG favicon·Apple Touch Icon에 적용했습니다. 첨부 OG 이미지를 1200×630으로 조정해 `public/og-image.png`에 포함했으며 기존 Open Graph/Twitter Card 태그와 일치시켰습니다. 대시보드 큰 소개 카드는 브라우저별 첫 방문만 펼치고, 이후 방문에는 접힌 안내 바로 표시합니다. 다시 보기/접기는 언제든 가능합니다. 화면 상태는 로컬 저장소에만 저장되며 분석 데이터에는 영향을 주지 않습니다.

## 설치 및 실행

```bash
npm install
npm run dev
```

## 검증

```bash
npm run build         # TypeScript + Vite 프로덕션 빌드
npm test              # Vitest 단위 테스트
npm run qa:all        # 스모크 + 브라우저 미사용 회귀 검사(온보딩/브랜드 포함)
npx playwright install chromium
npm run test:e2e      # 브라우저 JSON 복원/삭제/가이드
```

`.github/workflows/quality.yml`에는 위 검증 절차가 설정되어 있습니다. **npm 레지스트리 DNS 문제로 이 작업 환경에서 의존성을 설치할 수 없었습니다. `npm run build`는 `vite/client` 타입 누락(TS2688), `npm test`는 `vitest: not found`로 중단됐으며 Playwright도 실행하지 못했습니다.** 실행되지 않은 검사는 통과로 표시하지 않습니다.

### 배포 전 체크

1. 실제 사용자 데이터를 JSON으로 먼저 백업합니다.
2. GitHub **새 브랜치/PR 또는 Vercel Preview**에서 `npm install && npm run build && npm test && npm run qa:all && npm run test:e2e`를 통과시킵니다.
3. Playwright 테스트의 기본 데이터는 격리된 브라우저 컨텍스트에만 저장되며 사용자 실제 브라우저 DB를 만지지 않습니다.
4. OG 미리보기 이미지를 사용할 때에는 `public/og-image.png`를 추가하고 `<https://youtube-radar-six.vercel.app/og-image.png>`가 HTTP 200을 반환하는지 확인합니다. 필요시 X/Twitter와 Open Graph 캐시를 새로 검사합니다.
5. 모든 검사와 화면 점검이 끝나기 전에는 프로덕션 교체를 보류합니다. CI 워크플로를 추가한 것만으로 GitHub 브랜치 보호나 Vercel의 배포 차단이 자동 설정되지는 않습니다.

### 잠금 파일 상태

`package-lock.json`은 이 작업 환경의 npm 레지스트리 접근 불가로 생성하지 못했습니다. CI는 임시로 `npm install`을 사용합니다. 패키지 설치가 가능한 환경에서 `npm install --package-lock-only`로 생성 후 커밋하고, CI와 README 명령을 `npm ci`로 바꿔야 빌드 재현성을 높일 수 있습니다.

## 보안·데이터 주의

- API 키는 URL 요청 매개변수로 Google API에 전달되므로 Google Cloud HTTP 리퍼러/API 제한을 적용해야 합니다.
- API 키는 JSON 내보내기에 포함하지 않습니다.
- 사용자 정의 기준 채널·경쟁 관계는 공개 YouTube 통계와 분리해 저장합니다. 만료된 공개 채널 메타데이터가 없더라도 기존 그룹 ID는 사용자 의도를 보존하기 위해 유지할 수 있습니다.
- 복원 과정에서는 **새로 들어오는** 무효·만료 참조를 거부합니다. 기존 사용자가 만든 그룹을 조용히 삭제하지 않습니다.
- YouTube 전체 시장을 대표하는 추천, 공식 급상승 순위, 클릭률·유지율·썸네일 효과의 확정적인 해석은 제공하지 않습니다.

개발 관련 검증 상세는 `checklist.md`, 기능 사용 순서는 `User manual.md`, 작업 인계 사항은 `context-notes.md`를 참고하세요.

## v1.6.1 리소스 및 온보딩
- 업로드한 원본 로고: `public/logo.png` (투명 배경, 1254×1254). 앱 사이드바·상단 브랜드 마크에서 표시.
- 브라우저용 크기: `public/favicon.png` (64×64), `public/apple-touch-icon.png` (180×180). 기존 `favicon.svg`는 호환용으로 남겨두었으나 HTML에서는 PNG를 사용.
- 소셜 공유: `public/og-image.png` (1200×630). `index.html`의 `og:image`/`twitter:image`에서 절대 URL 사용.
- 대시보드 소개: 처음 한 번 펼침 → 재진입/새로고침부터 접힘. 버튼으로 접기 및 다시 펼치기가 가능하며, 브라우저 저장소가 차단되면 새로고침 사이에 선호도를 보존하지 못할 수 있습니다.
- 관련 테스트: `npm run qa:onboarding`(로컬 TypeScript 컴파일러 필요), 전체 비의존성 회귀 검사 `npm run qa:all`.
- 배포 후 운영 도메인에서 `/logo.png`, `/favicon.png`, `/og-image.png`가 이미지로 응답하고 공유 미리보기 캐시가 갱신되는지 확인해야 합니다. **운영 배포와 Playwright E2E는 별도 검증이 필요합니다.**
