# ERRORS

## 개요

이 문서는 `bora-web/backend`의 에러 응답 형식과 엔드포인트별 대표 에러 케이스를 정리한다.

현재 주요 라우터는 `HttpError + asyncHandler + errorHandler` 조합으로 정리되어 있으며, 실패 응답은 기본적으로 `{ ok: false, message }`를 따른다.

## 전역 에러 핸들러

- 파일: `middleware/errorHandler.js`
- 기본 규칙:
  - `err.status`가 정수면 해당 status 사용
  - 아니면 기본 status `400`
  - 응답 포맷: `{ ok: false, message }`

전역 포맷 예시:

```json
{
  "ok": false,
  "message": "올바르지 않은 mainContentId입니다."
}
```

## 에러 응답 규칙

### 1) 전역 규칙

- `HttpError(message, status)`를 던지면 전역 핸들러가 동일 포맷으로 응답한다.
- 기본 실패 포맷: `{ ok: false, message }`
- status 분류:
  - `401`: 인증 실패(sessionid 없음/무효/만료)
  - `403`: 권한 없음(작성자 불일치 등)
  - `400`: 유효성 오류(ObjectId 형식, 필수값, 길이 제한)

### 2) 예외

- 일부 성공 응답은 도메인별 포맷(`{ success: true, ... }`, `{ comment: ... }`, 배열 직접 반환 등)을 유지한다.
- 문서의 "에러 규칙"은 실패 응답 기준이다.

### 3) 제한/미들웨어 에러

- `express-rate-limit` 응답:

```json
{
  "ok": false,
  "message": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
}
```

- 인증 미들웨어 세션 만료 응답 (`401`):

```json
{
  "ok": false,
  "message": "세션이 만료되었습니다."
}
```

## 대표 에러 매트릭스

### Users

- `POST /users/register`
  - `400`: 비밀번호 6자 미만
  - `400`: username 3자 미만
  - `400`: username 중복(Unique 제약)
- `PATCH /users/login`
  - `401`: 가입되지 않은 계정
  - `401`: 비밀번호 불일치
- `PATCH /users/logout`
  - `401`: `req.user` 없음 (`invalid sessionid`)
- `GET /users/me`
  - `401`: 인증 사용자 없음
- `GET /users/me/mainContents`
  - `400`: `lastid` 형식 오류
  - `401`: 인증 사용자 없음

### MainContents

- `POST /mainContents`
  - `401`: 인증 사용자 없음
  - `400`: URL 검증 실패(`web_link`)
- `GET /mainContents`
  - `400`: `lastid` 형식 오류
- `GET /mainContents/:mainContentId`
  - `400`: 잘못된 ObjectId
  - `404`: 리소스 없음
- `DELETE /mainContents/:mainContentId`
  - `401`: 인증 사용자 없음
  - `403`: 작성자 불일치
  - `403`: 작성자 정보 없음
- `PATCH /mainContents/:mainContentId/meta`
  - `401`: 인증 사용자 없음
  - `403`: 작성자 불일치
  - `404`: 리소스 없음
  - `400`: title 비어있음/길이 초과
  - `400`: 수정 항목 없음
- `PATCH /mainContents/:mainContentId/like`
  - `401`: 인증 사용자 없음
  - `400`: ObjectId 형식 오류
- `PATCH /mainContents/:mainContentId/unlike`
  - `401`: 인증 사용자 없음
  - `400`: ObjectId 형식 오류
- `PATCH /mainContents/:mainContentId`
  - `400`: `hashArr` 누락/공백
  - `400`: 태그 길이 초과(64)
- `PATCH /mainContents/:mainContentId/delTag/:categoryValue`
  - `401`: 인증 사용자 없음
  - `400`: ObjectId 형식 오류

### Comments

- `POST /mainContents/:mainContentId/comment/saveComment`
  - `401`: 인증 사용자 없음
  - `400`: `mainContentId` 형식 오류
  - `400`: content 공백
  - `400`: content 길이 초과(8000)
- `GET /mainContents/:mainContentId/comment`
  - `400`: `mainContentId` 형식 오류
- `PATCH /mainContents/:mainContentId/comment/:commentId`
  - `401`: 인증 사용자 없음
  - `400`: `commentId` 형식 오류
  - `400`: content 누락/공백/길이 초과
  - `403`: 작성자 불일치
  - `404`: 댓글 없음
- `DELETE /mainContents/:mainContentId/comment/:commentId`
  - `401`: 인증 사용자 없음
  - `400`: `commentId` 형식 오류
  - `403`: 작성자 불일치
  - 삭제 대상 없음 시 `200 { comment: null }` 반환

## 클라이언트 처리 가이드

- 우선순위:
  1. HTTP status 확인
  2. `message` 파싱
  3. `ok` 필드는 존재 시만 사용
- 인증 관련:
  - `401` + `"세션이 만료되었습니다."`이면 재로그인 유도
  - `401` + `"invalid sessionid"`도 로그아웃 상태로 간주
- 유효성 검증:
  - `400` 메시지는 사용자에게 직접 노출 가능한 한국어 문구가 많아 그대로 사용 가능

## 개선 완료 사항

운영/프론트 안정성을 위해 아래 항목을 우선 반영했다.

- 에러 포맷 통일: 실패 응답을 `{ ok: false, message }` 기준으로 정렬
- 상태코드 기준 고정: `401` 인증 실패, `403` 권한 없음, `400` 유효성 오류
- `userRouter`를 `try/catch` 직접 응답에서 `HttpError + errorHandler`로 일원화

남은 개선 후보:

- 비즈니스 에러 코드(`code`) 필드 도입 여부 검토
- 모든 성공 응답 포맷까지 단일 규격으로 통합할지 결정
