# AUTH

## 개요

이 문서는 `bora-web/backend`의 현재 인증 방식을 정리한다. 인증은 JWT가 아닌 세션 기반이며, 클라이언트는 모든 요청에서 `sessionid` 헤더를 사용할 수 있다.

- 인증 미들웨어: `middleware/authentication.js`
- 적용 위치: `server.js`의 `app.use(authenticate)` (전역)

## 인증 메커니즘

1. 로그인/회원가입 성공 시 `sessionId`를 발급한다.
2. 클라이언트는 이후 요청 헤더에 `sessionid: <sessionId>`를 포함한다.
3. 서버는 `User.sessions._id`에서 세션을 조회한다.
4. 유효 세션이면 `req.user`를 주입한다.
5. 세션 생성 후 7일이 지나면 만료 처리한다.

## 세션 정책

- 세션 TTL: 7일 (`SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000`)
- 로그인 시 사용자당 최대 세션 수: 5개 (`MAX_SESSIONS_PER_USER = 5`)
- 5개를 초과하면 오래된 세션부터 제거하고 최근 5개만 유지한다.
- 만료 세션은 인증 미들웨어에서 DB에서 제거한 뒤 `401`을 반환한다.

## 헤더 규칙

- 헤더 키: `sessionid` (소문자)
- 값 형식: MongoDB ObjectId 문자열
- 헤더가 없거나 ObjectId 형식이 아니면 인증 미들웨어는 통과시키며 `req.user`를 세팅하지 않는다.
- 용어 구분:
  - `sessionid`: 요청 헤더 키
  - `sessionId`: 응답 본문 필드 키

## 고정 에러 분류 규칙

- `401`: 인증 실패(sessionid 없음/무효/만료)
- `403`: 권한 없음(작성자 불일치 등)
- `400`: 유효성 오류(ObjectId 형식, 필수값, 길이 제한)

## 인증 관련 엔드포인트

### `POST /users/register`

- 입력: `name`, `username`, `password`
- 검증:
  - `password.length >= 6`
  - `username.length >= 3`
- 성공 시 첫 세션을 생성하고 `sessionId`를 반환한다.

응답 예시:

```json
{
  "message": "user registered",
  "sessionId": "663b...",
  "name": "홍길동",
  "userId": "663a..."
}
```

### `PATCH /users/login`

- 입력: `username`, `password`
- 검증:
  - 유저 존재 여부
  - bcrypt 비밀번호 일치
- 성공 시 새 세션을 추가하고 `sessionId`를 반환한다.

응답 예시:

```json
{
  "message": "user validated",
  "sessionId": "663c...",
  "name": "홍길동",
  "userId": "663a..."
}
```

### `PATCH /users/logout`

- 전제: `req.user`가 존재해야 한다.
- 동작: `req.headers.sessionid`에 해당하는 세션을 현재 사용자에서 제거한다.
- 인증 실패 시: `401 { "ok": false, "message": "invalid sessionid" }`

### `GET /users/me`

- 전제: `req.user`가 존재해야 한다.
- 동작: 현재 세션 기준 사용자 정보를 반환한다.
- 인증 실패 시: `401 { "ok": false, "message": "권한이 없습니다." }`

## 보호 엔드포인트 요약

`req.user`가 반드시 필요한 주요 엔드포인트:

- `PATCH /users/logout`
- `GET /users/me`
- `GET /users/me/mainContents`
- `POST /mainContents`
- `DELETE /mainContents/:mainContentId`
- `PATCH /mainContents/:mainContentId/meta`
- `PATCH /mainContents/:mainContentId/like`
- `PATCH /mainContents/:mainContentId/unlike`
- `PATCH /mainContents/:mainContentId/delTag/:categoryValue`
- `POST /mainContents/:mainContentId/comment/saveComment`
- `PATCH /mainContents/:mainContentId/comment/:commentId`
- `DELETE /mainContents/:mainContentId/comment/:commentId`

## 인증 실패 응답 패턴

현재 인증 실패 응답은 전역 에러 핸들러 기준으로 통일되어 있다.

1. 인증 미들웨어(세션 만료):

```json
{
  "ok": false,
  "message": "세션이 만료되었습니다."
}
```

HTTP Status: `401`

2. 보호 라우트에서 인증 정보 없음:

```json
{
  "ok": false,
  "message": "권한이 없습니다."
}
```

HTTP Status: `401`

추가 예시:

```json
{
  "ok": false,
  "message": "invalid sessionid"
}
```

HTTP Status: `401`
