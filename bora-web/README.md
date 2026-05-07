#### 로컬에서 시작하려면

백엔드 시작후 프론트엔드 시작

- 백엔드 :
- cd backend
- npm i (처음 시작 할때 만)
- npm run dev

- 프론트엔드 :
- cd frontend
- npm i (처음 시작 할때 만)
- npm run start

- frontend - package.json - "proxy": "http://localhost:5000",

### 보안 (백엔드)

- **helmet** — 보안 관련 HTTP 헤더
- **express-mongo-sanitize** — 요청 데이터의 MongoDB 연산자 조작(NoSQL 인젝션) 완화
- **express.json({ limit: "1mb" })** — JSON 본문 크기 제한
- **세션 TTL** — 생성 시각 기준 7일 (`middleware/authentication.js` 의 `SESSION_TTL_MS`)
- **원문 URL** — `utils/urlSecurity.js` 로 http/https 만 허용
- **댓글·검색·태그** — 길이 상한(라우터에서 검증)

SQL DB를 사용하지 않으므로 SQL 인젝션은 해당 없음.

### 보안 (프론트)

- **safeUrl.js** — 상세 페이지 `원문 보기` 링크에 http(s)만 사용

#### docker 이미지로 시작하려면

- frontend - package.json - "proxy": "http://backend:5000",

- docker-compose up

- docker-compose up —build

### 파일구조

```jsx
backend
|── src
│   ├── middleware
│   │   ├── authentication //세션권한
│   │   ├── mainContentUpload //업로드( 대체예정 ), 컨텐츠 업로드시 파일 이름 생성, 파일 필터
│   │   ├── index
│   ├── models
│   │   ├── Comment //댓글
│   │   ├── MainContent //컨텐츠
│   │   ├── User // 로그인, 회원가입, 세션
│   │   ├── index
│   ├── routes
│   │   ├── commentRouter //댓글crud
│   │   ├── mainContentRouter //업로드( 대체예정 ),컨텐츠crud,좋아요
│   │   ├── userRouter //가입, 로그인, 로그아웃, 권한
│   │   ├── index
│   ├── uploads //사진 물리적 저장 (대체예정)
├── server.js
├── utils
│   ├── asyncHandler.js
│   ├── response.js
│   └── urlSecurity.js   // 원문 링크 http(s) 검증

frontend
|── src
│ ├── components //컴포넌트
│ │ ├── CommentList //댓글 list
│ │ ├── Comments //댓글 저장
│ │ ├── CustomInput //사용자 input정보를 관리
│ │ ├── LinkUploadForm.js //북마크 링크 업로드
│ │ ├── MainContentList //컨텐츠 배열(list)로 보여줌
│ │ ├── MainContentUploadForm //메인 컨텐츠 업로드(LinkUploadForm.js 대체)
│ │ ├── ProgressBar //사진 업로드시 진행바 (고려)
│ │ ├── SearchFeature //검색
│ │ ├── Tags //카테고리기능
│ │ ├── ToolBar //메뉴
│ ├── lib
│ │   └── safeUrl.js // 상세 화면 외부 링크 href 안전 처리
│ ├── context //전역함수,변수,state관리
│ │ ├── AuthContext //인증 관련
│ │ ├── MainContentContext //메인 컨텐츠 관련
│ ├── pages //페이지
│ │ ├── LoginPage //로그인 페이지
│ │ ├── MainContentPage //상세 페이지 (스크립샷,컨텐츠 정보,수정-모달,댓글)
│ │ ├── MainPage //메인 페이지(ToolBar, MainContentList,SearchFeature)
│ │ ├── RegisterPage //회원가입(CustomInput)
│ │ ├── UploadPage //컨텐츠 업로드 페이지
├── App.js //(ToolBar,메뉴Route,토스트)
├── index.js //App

```
