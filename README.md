# YouTube Radar — youtube-radar-v1.1.2

**사용자 개인 API 키 기반의 한국어 YouTube 경쟁 채널 분석 웹앱**. React + TypeScript + Vite 기반이며, 서버 API·로그인·중앙 데이터베이스가 없습니다. 분석 결과는 개인 브라우저의 IndexedDB에 보관하고 JSON으로 백업합니다.

> v1.0.2: Vercel TypeScript 오류 TS2349 (2곳), TS2554 (1곳)를 수정했습니다. 이 환경에서는 npm DNS 실패로 전체 의존성 빌드를 재검증하지 못했습니다.

> 개발 단계: 기능 구현 소스 및 단위 테스트 작성 완료. 현재 제작 환경은 npm 레지스트리 DNS 조회가 실패하여 의존성 설치, 실제 브라우저 E2E 및 프로덕션 번들 검증을 수행하지 못했습니다. 일반적인 인터넷 접근이 가능한 환경에서 아래 명령으로 빌드·검증해야 합니다. 실제 YouTube API 키 통합 검증도 필요합니다.

## 구현된 기능

| 구역 | 내용 |
|---|---|
| API 설정 | BYOK, 키 유효성 조회, 세션 기본/선택적 localStorage 보존, 키 연결 해제 |
| 검색 | 채널명(한국 관련성 우선) 검색, @핸들/채널 URL 및 채널 ID 직접 조회 |
| 수집 | 채널 통계 및 최근 50개 영상 (`channels`, `playlistItems`, `videos`), 사용자 수동 갱신, 선택적 100/200개 |
| 분석 | 조회수·좋아요·댓글·시간 정렬, 기간/유형 필터, 영상 카테고리 분포, 공개 채널 주제 |
| 쇼츠 | 정확히 알 수 없는 3분 이하 영상은 미분류. 사용자가 롱폼/쇼츠를 직접 지정할 수 있음 |
| 경쟁 분석 | 다중 기준 채널, 대표 지정, 기준별 경쟁 목록, 후보 키워드 검색, 공개 성과 비교, 인기/소형 채널 영상 발굴, 공식 카테고리 공백 |
| 로컬 데이터 | Dexie/IndexedDB 저장, 30일 만료 처리, JSON 병합·교체 복원(키 미포함), 전체 삭제 |
| 정적 오프라인 | 배포 후 방문 시 서비스 워커가 앱 정적 파일을 캐시. 온라인 수집 없이 이전 저장 데이터 열람 가능 |
| 배포 | Vercel SPA 라우팅 설정 및 GitHub 소스 배포 가능 |

## 빠른 실행

Node.js 20 이상 권장.

```bash
npm install
npm run dev
```

개발 서버가 표시한 주소(`http://localhost:5173`)로 접속하세요.

프로덕션 빌드 및 로컬 검증:

```bash
npm run build
npm run preview
npm test
npm run smoke
```

`npm run smoke`는 대체 검증용입니다. 글로벌 TypeScript(또는 이 제작 환경의 경로)가 필요하며, TSX 구문, 핵심 유틸리티, 모의 YouTube API 호출 흐름을 검사합니다. 표준 `npm test`는 Vitest 테스트입니다.

## API 키 설정

1. [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com)에서 프로젝트를 만듭니다.
2. YouTube Data API v3를 사용 설정하고 API 키를 발급합니다.
3. API 키를 Google Cloud의 **YouTube Data API v3 제한**, **HTTP 리퍼러 제한**으로 가능한 범위에서 제한합니다.
4. 앱의 설정에서 키를 입력하고 **연결 확인 및 적용**을 누릅니다.
5. 기본적으로 키는 메모리에만 남습니다. '이 브라우저에 기억하기'를 사용하면 localStorage에 저장됩니다. JSON 백업에는 포함되지 않습니다.

애플리케이션은 API 키를 YouTube API 요청의 URL 쿼리 파라미터로 전달합니다(공식 키 인증 방식). 다른 사용자의 서버로 전송하지 않지만 네트워크 개발자 도구에서는 노출될 수 있습니다. 브라우저의 localStorage에 저장된 키는 완전한 비밀정보 보관소가 아닙니다.

## 배포 방법 (GitHub → Vercel)

1. `youtube-radar-v1.0.2` 폴더의 소스 파일을 GitHub 저장소에 올립니다. **API 키, `.env`, 개인 JSON 백업 파일은 올리지 마세요.**
2. Vercel → Add New Project → 해당 GitHub 저장소를 선택합니다.
3. Framework Preset: `Vite`, Build Command: `npm run build`, Output Directory: `dist`.
4. 환경 변수로 API 키를 지정할 필요가 없습니다. 각 사용자가 브라우저에서 키를 입력합니다.
5. 배포 후 생성된 URL로 Google Cloud API 키의 리퍼러 제한을 지정합니다. 커스텀 도메인을 사용하는 경우 해당 도메인도 허용해야 합니다.
6. `/search`, `/compare`, `/channel/UC...` 직접 접속을 확인합니다. SPA 재작성 규칙은 `vercel.json`에 있습니다.
7. 모바일·데스크톱 및 실제 API 키로 검색 → 분석 → 갱신 → 복원 흐름을 검사합니다.

## 데이터 구성

| IndexedDB 저장소 | 용도 |
|---|---|
| `channels` | 공개 채널 메타정보, 통계 및 수집 시각 |
| `videos` | 공개 영상의 통계 및 사용자 직접 지정 유형 |
| `snapshots` | 수동 갱신할 때 수집한 조회수 관측값 (30일 보관) |
| `owners` | 기준 채널(복수 가능), 대표 채널 1개 |
| `competitors` | 기준 채널에 연결한 경쟁 채널 관계 |
| `settings` | 브라우저 환경설정(키 제외) |

백업 스키마는 `schemaVersion: "1.0.0"`이고 `app: "youtube-radar"`를 사용합니다. `importBackup`은 Zod로 입력을 검사합니다. 오래된 공개 API 데이터는 백업 복원에서 건너뜁니다. 사용자가 직접 관리한 채널 관계는 유지됩니다.

## 정확성 및 정책 안내

- 공개 YouTube Data API만으로 영상이 쇼츠인지 완전하게 확정할 수 없습니다. 긴 영상은 롱폼으로 표시하고 **3분 이하 영상은 미분류**로 유지하는 보수적 기본값을 사용합니다. 사용자가 직접 지정한 유형은 공식 정보가 아닙니다.
- 구독자 수/좋아요/댓글은 공개되지 않을 수 있으며 누락값은 0이 아니라 `null`로 저장합니다.
- 내 채널은 URL로 지정하는 **기준 채널**입니다. 소유권을 증명하지 않으므로 YouTube Analytics의 CTR/시청 유지율 등 비공개 정보에는 접근하지 않습니다.
- 관측 시점이 없는 과거 영상의 게시 후 24시간 조회수를 역산하지 않습니다. 비교 화면의 조회수는 누적값입니다.
- 경쟁 후보는 키워드 검색 결과입니다. 전체 YouTube를 대상으로 한 추천이나 성과 순위를 뜻하지 않습니다. '콘텐츠 공백'은 **영상의 공식 카테고리 차이**만 보여주며 수요나 성공 가능성을 보장하지 않습니다.
- 공개 API 데이터는 기본적으로 30일 수명 규칙을 적용합니다. 앱이 오랫동안 실행되지 않았다면 브라우저 종료 중 자동 삭제는 보장할 수 없습니다. 서비스 운영자는 [YouTube API 개발자 정책](https://developers.google.com/youtube/terms/developer-policies)을 직접 검토해야 합니다.
- 사용자별 Google Cloud 키를 여러 사용자가 쓰는 모델이 YouTube 정책상 허용되는지, 특정 분석 지표·캐싱·장기 보관이 허용되는지는 **공개 출시 전에 별도로 검증**해야 합니다. 다른 서비스의 사용 사례만으로 정책 준수를 보장하지 않습니다.
- 서비스 워커는 동일 출처 앱 파일만 캐시합니다. YouTube API 응답과 비밀 키를 Cache Storage에 넣지 않습니다.
- 별도 분석 서버가 없으므로 사용자 사이의 데이터 공유나 백그라운드 자동 수집은 지원하지 않습니다.

## 주요 파일

```text
src/App.tsx                       # 앱 라우팅·화면·로컬 CRUD
src/components/CompetitionInsights.tsx
src/lib/youtube.ts               # 공식 YouTube Data API 클라이언트
src/lib/storage.ts               # IndexedDB 및 JSON 백업
src/lib/types.ts                 # 데이터 타입
src/lib/utils.ts                 # 날짜·숫자·분류 및 URL 유틸리티
src/styles.css                   # 반응형/접근성 UI
public/sw.js                     # 정적 자산 오프라인 캐시
vercel.json                      # Vercel SPA 재작성 및 보안 헤더
```

## 검사 상태

- TypeScript/TSX **구문 파싱: 통과**
- 순수 유틸리티 9개 검증: 통과
- 모의 채널/재생목록/영상 API 호출 및 결과 검증 7개: 통과
- `src/lib/types.ts`, `utils.ts`, `youtube.ts` 대상 `tsc --noEmit --strict`: 통과
- 전체 `npm install`, `npm run build`, `npm test`, 브라우저 E2E: **환경의 npm DNS 실패로 미검증**

## 다음 개선 방향

실제 사용자 키 통합 테스트, 보안 및 접근성 점검, 채널별 관측 성장률 시각화, Shorts 검증 가능성 및 정책 확인, 페이지 컴포넌트 파일 분리.


## v1.0.1 추가 수정 및 검증 상태
- 최근 N개 수집에서 제외된 오래된 영상·관측 기록을 정리합니다.
- 동일한 기준 채널 재등록 시 대표 채널 설정을 유지합니다.
- 대표 채널을 라이브러리에서 삭제하면 남은 기준 채널에서 새 대표를 지정합니다.
- 소스 구문 및 모의 API 테스트 통과. 전체 `npm install && npm run build && npm test` 검증은 환경의 npm 레지스트리 연결 문제로 미완료입니다.
- 실제 YouTube API 키 통합 테스트, Chromium E2E, GitHub 푸시·Vercel 배포는 미완료입니다.


## v1.1.0: Google Cloud API 키 가이드
- `/api-guide`에서 Google 계정 → 프로젝트 → YouTube Data API v3 → API 키 생성 → HTTP 리퍼러 + API 제한 → 앱 연결을 안내합니다.
- 사용자가 제공한 초보자용 안내 구조(목차, 번호 단계, 복사용 값, 오류 해결)를 적용하되 OAuth 관련 단계는 포함하지 않습니다.
- 설정 화면, 미연결 배너, 사이드바에 안내 링크를 제공합니다.
- Google Cloud 보안 제한 설정은 자동 검증할 수 없어 체크리스트는 사용자 자기 확인입니다.

### 가이드 페이지 배포 확인
- `https://youtube-radar-six.vercel.app/api-guide` 경로로 열리는지 확인합니다.
- 좌측 **API 키 발급 가이드**, 미연결 경고, 설정 화면의 안내 버튼으로 같은 페이지가 열립니다.
- 보안 확인 2개는 설정 및 가이드에서 공유되는 사용자 직접 확인 기록이며 Google Cloud 콘솔을 자동 검증하지 않습니다.
- npm 인터넷 연결 오류로 이 배포 파일에 대한 전체 Vite 빌드/실기 검증은 작성 환경에서 수행하지 못했습니다.


## v1.1.1: API 키 진입점 정리
- GitHub `main` 브랜치에 v1.0.2만 올라간 배포에는 가이드가 표시되지 않으므로 v1.1.1 전체 파일로 교체해야 합니다.
- API 키 미연결 시 상단 중복 버튼을 제거했습니다. 첫 진입은 **API 키 발급 가이드**, 보조 진입은 **이미 키가 있어요**입니다.
- 상태 표시를 **브라우저에 저장됨**으로 명확히 바꿨습니다. 이 표시를 눌러야 하는 버튼으로 안내하지 않습니다.
- 모바일에서도 미연결 배너의 가이드 버튼이 우선 표시되며, `/api-guide`는 직접 접근할 수 있습니다.

## v1.1.2: 공개 가이드 문구 정리
- 다른 프로젝트명을 공개 가이드에서 제거하고, API 키 발급에 필요한 OAuth 안내만 남겼습니다.
- 예시 코드나 사용자 인증키, 첨부 프로젝트의 자막 샘플은 포함하지 않습니다.
