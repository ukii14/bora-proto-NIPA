# DB_SCHEMA

## 개요

이 문서는 `bora-web/backend/models` 기준 MongoDB 데이터 구조를 정리한다. 실제 스키마의 단일 기준(Single Source of Truth)은 Mongoose 모델 코드다.

대상 모델:

- `User` (`models/User.js`)
- `MainContent` (`models/MainContent.js`)
- `Comment` (`models/Comment.js`)

## 컬렉션/모델 매핑

- `User` 모델명: `user`
  - 컬렉션: Mongoose 기본 네이밍 규칙에 의해 `users`
- `Comment` 모델명: `comment`
  - 컬렉션: `comments`
- `MainContent` 모델명: `maincontent`
  - 컬렉션: 명시적으로 `blog_posts` 사용

## 스키마 상세

### 1) User (`users`)

| 필드 | 타입 | 필수 | 기본값 | 제약/설명 |
|---|---|---|---|---|
| `name` | `String` | Yes | - | 사용자 이름 |
| `username` | `String` | Yes | - | 고유값(`unique: true`) |
| `hashedPassword` | `String` | Yes | - | bcrypt 해시 비밀번호 |
| `sessions` | `Array<Object>` | No | `[]` | 로그인 세션 목록 |
| `sessions[].createdAt` | `Date` | Yes | - | 세션 생성 시각 |
| `createdAt` | `Date` | Yes | auto | `timestamps: true` |
| `updatedAt` | `Date` | Yes | auto | `timestamps: true` |

주요 특징:

- 로그인 성공 시 `sessions`에 새 세션이 추가된다.
- 사용자당 세션은 최대 5개만 유지된다.

### 2) MainContent (`blog_posts`)

| 필드 | 타입 | 필수 | 기본값 | 제약/설명 |
|---|---|---|---|---|
| `user` | `Object` | Yes | - | 작성자 스냅샷 |
| `user._id` | `ObjectId` | Yes | - | 인덱스(`index: true`) |
| `user.name` | `String` | Yes | - | 작성 시점 이름 |
| `user.username` | `String` | Yes | - | 작성 시점 아이디 |
| `likes` | `ObjectId[]` | No | `[0]`* | 좋아요 사용자 ID 배열 |
| `public` | `Boolean` | No | `true` | 공개 여부 |
| `key` | `String` | Yes | - | 업로드 파일 키 |
| `originalFileName` | `String` | Yes | - | 원본 파일명 |
| `web_link` | `String` | No | - | 외부 링크 |
| `title` | `String` | No | - | 제목 |
| `text` | `String` | No | - | 본문 |
| `cTime` | `String` | No | - | 시간 문자열(legacy 가능성) |
| `category` | `String` | No | - | 카테고리 |
| `hashArr` | `Array` | No | - | 태그/해시 배열 |
| `tagArr` | `Array` | No | - | 태그 배열 |
| `summary` | `String` | No | - | 요약 |
| `commentsCount` | `Number` | Yes | `0` | 댓글 수 캐시 |
| `comments` | `CommentSchema[]` | No | `[]` | 임베디드 댓글 배열 |


주요 특징:

- `MainContent`는 별도 컬렉션명 `blog_posts`를 강제한다.
- 작성자 정보를 `ref`가 아닌 스냅샷(`user` 객체)로 저장한다.
- `timestamps` 설정이 주석 처리되어 `createdAt/updatedAt` 자동 컬럼이 없다.

### 3) Comment (`comments`)

| 필드 | 타입 | 필수 | 기본값 | 제약/설명 |
|---|---|---|---|---|
| `content` | `String` | Yes | - | 댓글 본문 |
| `writer` | `ObjectId` | Yes | - | `ref: "user"`, 인덱스 |
| `postId` | `ObjectId` | Yes | - | `ref: "maincontent"`, 인덱스 |
| `createdAt` | `Date` | Yes | auto | `timestamps: true` |
| `updatedAt` | `Date` | Yes | auto | `timestamps: true` |

주요 특징:

- `writer`, `postId`로 참조 관계를 만든다.
- 조회 시 `writer`는 `populate("writer")`로 확장된다.

## 인덱스 정의

### User

- `username` unique 인덱스 (스키마 옵션 기반)

### MainContent

- 단일 인덱스: `{ "user._id": 1 }`
  - 코드상 `{ "user._id": 1, updatedAt: 1 }`로 선언되어 있으나 `updatedAt` 필드는 기본 생성되지 않는다.
- 텍스트 인덱스: `MainContentTextIndex`
  - 키: `{ title: "text", hashArr: "text", summary: "text", text: "text" }`
  - 가중치: `title:10`, `hashArr:5`, `summary:3`, `text:1`
  - `default_language: "none"`

### Comment

- 필드 인덱스:
  - `writer` (`index: true`)
  - `postId` (`index: true`)
- 추가 인덱스:
  - 코드상 `CommentSchema.index({ mainContent: 1, createdAt: -1 })`
  - 현재 스키마에는 `mainContent` 필드가 없고 `postId`가 존재하므로 의도와 구현 불일치 가능성이 있다.

## 관계 구조

### 참조 관계

- `Comment.writer` -> `User._id` (`ref: "user"`)
- `Comment.postId` -> `MainContent._id` (`ref: "maincontent"`)

### 임베디드 관계

- `MainContent.comments`는 `CommentSchema[]`를 임베드한다.
- 동시에 `Comment` 컬렉션을 별도로 운영하고 있어 댓글 데이터 저장 전략이 혼합되어 있다.
  - 실제 라우터는 `Comment` 컬렉션 중심으로 동작하고 `MainContent.comments`는 현재 주요 로직에서 활용 빈도가 낮다.

## 데이터 흐름 요약

- 게시물 작성: `MainContent` 생성 (`blog_posts`)
- 댓글 작성: `Comment` 생성 + `MainContent.commentsCount` 증가
- 댓글 삭제: `Comment` 삭제 + `MainContent.commentsCount` 감소
- 게시물 삭제: `MainContent` 삭제 + 해당 `Comment(postId)` 일괄 삭제
